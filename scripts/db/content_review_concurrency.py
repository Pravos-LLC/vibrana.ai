# /// script
# dependencies = ["psycopg[binary]==3.2.9"]
# ///
"""Run: uv run scripts/db/content_review_concurrency.py LOCAL_POSTGRES_URL.
Uses a disposable database on the local cluster; never changes dogfood data.
"""
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo

params = conninfo_to_dict(sys.argv[1])
assert params.get('host') in ('127.0.0.1', 'localhost'), 'Local database only'
name = 'review_race_' + uuid.uuid4().hex
admin = psycopg.connect(sys.argv[1], autocommit=True)
admin.execute(sql.SQL('create database {}').format(sql.Identifier(name)))
url = make_conninfo(**(params | {'dbname': name}))
try:
    with psycopg.connect(url, autocommit=True) as setup:
        setup.execute('''
          create schema auth; create schema storage;
          create function auth.jwt() returns jsonb language sql as
            $$select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}')$$;
          create function auth.uid() returns uuid language sql as $$select null::uuid$$;
          grant usage on schema auth to authenticated, service_role;
          create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
          create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
          alter table storage.objects enable row level security;
        ''')
        setup.execute((Path(__file__).parents[1] / 'migrations/20260928150000_content_review.sql').read_text())
        batch, asset = uuid.uuid4(), uuid.uuid4()
        setup.execute("insert into public.review_batches(id,series,round,title,workspace_dir) values(%s,'race',1,'Race','x')", (batch,))
        setup.execute("insert into public.review_assets(id,batch_id,position,slug,title,kind,storage_path) values(%s,%s,1,'a','A','image','a.jpg')", (asset,batch))

    def connection(role='service_role'):
        c = psycopg.connect(url)
        c.execute(sql.SQL('set role {}').format(sql.Identifier(role)))
        c.execute("set request.jwt.claims = '{\"app_metadata\":{\"gtm_owner\":true}}'")
        c.execute("set statement_timeout = '8s'")
        return c

    def wait_locked(pid):
        with psycopg.connect(url, autocommit=True) as observer:
            deadline = time.monotonic() + 5
            while time.monotonic() < deadline:
                row = observer.execute('select wait_event_type from pg_stat_activity where pid=%s', (pid,)).fetchone()
                if row and row[0] == 'Lock': return
                time.sleep(.02)
        raise AssertionError('Expected transaction to block on parent batch lock')

    with ThreadPoolExecutor() as pool:
        # A comment that starts first must commit before submit can finish.
        with connection('authenticated') as writer, connection('authenticated') as submitter:
            writer.execute('insert into public.review_comments(asset_id,body) values(%s,\'before submit\')', (asset,))
            future = pool.submit(submitter.execute, 'select public.submit_review(%s)', (batch,))
            wait_locked(submitter.info.backend_pid)
            assert not future.done()
            writer.commit()
            future.result()
            submitter.commit()
        print('PASS: submit waits for in-flight owner comment')

        # A writer starting while submission holds the lock must recheck the committed status.
        with psycopg.connect(url, autocommit=True) as setup:
            batch2, asset2 = uuid.uuid4(), uuid.uuid4()
            setup.execute("insert into public.review_batches(id,series,round,title,workspace_dir) values(%s,'race',2,'Race 2','x')", (batch2,))
            setup.execute("insert into public.review_assets(id,batch_id,position,slug,title,kind,storage_path) values(%s,%s,1,'a','A','image','a.jpg')", (asset2,batch2))
        with connection('authenticated') as submitter, connection() as writer:
            submitter.execute('select public.submit_review(%s)', (batch2,))
            future = pool.submit(writer.execute, 'insert into public.review_comments(asset_id,body) values(%s,\'too late\')', (asset2,))
            wait_locked(writer.info.backend_pid)
            submitter.commit()
            try: future.result()
            except psycopg.errors.CheckViolation: writer.rollback()
            else: raise AssertionError('Late comment was accepted')
        print('PASS: service-role writer waits then rejects after submit commits')

        # Cancellation must wait for an uncommitted reservation, then remove it.
        attempt = uuid.uuid4()
        with connection() as reserver, connection() as canceller:
            reserver.execute("select public.reserve_review_publication(%s,'race',3,'Race 3','x')", (attempt,))
            future = pool.submit(canceller.execute, 'select public.cancel_review_publication(%s)', (attempt,))
            wait_locked(canceller.info.backend_pid)
            reserver.commit()
            assert future.result().fetchone()[0] is True
            canceller.commit()
        with connection() as check:
            assert check.execute('select count(*) from public.review_publications where id=%s', (attempt,)).fetchone()[0] == 0
        print('PASS: cancellation waits for an uncommitted reservation')

        # Even if cancellation wins before reserve starts, its tombstone prevents resurrection.
        attempt = uuid.uuid4()
        with connection() as canceller:
            assert canceller.execute('select public.cancel_review_publication(%s)', (attempt,)).fetchone()[0] is True
        with connection() as reserver:
            try: reserver.execute("select public.reserve_review_publication(%s,'race',3,'Race 3','x')", (attempt,))
            except psycopg.errors.RaiseException as error:
                assert 'cancelled' in str(error)
                reserver.rollback()
            else: raise AssertionError('Cancelled reservation was resurrected')
        print('PASS: late reservation cannot resurrect a cancelled attempt')

finally:
    admin.execute(sql.SQL('drop database {} with (force)').format(sql.Identifier(name)))
    admin.close()
