// A stand-in for the Supabase client used by route tests. It records every query
// the route builds and answers each one through `db.respond`, which a test swaps
// out to shape the rows or errors that table returns. Nothing reaches a database.
//
// Usage in a test file:
//   vi.mock('@/lib/supabase', async () => ({ supabase: (await import('./helpers/fake-supabase')).db.client }))
//   import { db } from './helpers/fake-supabase'
//   db.respond = (q) => (q.table === 'bookings' ? { data: [...], error: null } : ok())

export type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete'

export interface Query {
  table: string
  op: Op
  payload?: unknown
  columns?: string
  filters: Array<[column: string, operator: string, value: unknown]>
  single: boolean
}

export interface Result {
  data: unknown
  error: { code?: string; message?: string } | null
}

export const ok = (data: unknown = null): Result => ({ data, error: null })
export const fail = (code: string, message = code): Result => ({ data: null, error: { code, message } })

function builder(table: string, state: FakeState) {
  const query: Query = { table, op: 'select', filters: [], single: false }
  const filter = (operator: string) => (column: string, value: unknown) => {
    query.filters.push([column, operator, value])
    return chain
  }
  const chain = {
    select(columns?: string) {
      if (query.op === 'select') query.columns = columns
      return chain
    },
    insert(payload: unknown) {
      query.op = 'insert'
      query.payload = payload
      return chain
    },
    update(payload: unknown) {
      query.op = 'update'
      query.payload = payload
      return chain
    },
    upsert(payload: unknown) {
      query.op = 'upsert'
      query.payload = payload
      return chain
    },
    delete() {
      query.op = 'delete'
      return chain
    },
    eq: filter('eq'),
    neq: filter('neq'),
    gte: filter('gte'),
    lte: filter('lte'),
    gt: filter('gt'),
    lt: filter('lt'),
    in: filter('in'),
    is: filter('is'),
    or(expression: string) {
      query.filters.push(['or', 'or', expression])
      return chain
    },
    not(column: string, operator: string, value: unknown) {
      query.filters.push([column, `not.${operator}`, value])
      return chain
    },
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    single() {
      query.single = true
      return chain
    },
    maybeSingle() {
      query.single = true
      return chain
    },
    then<T>(onFulfilled: (value: Result) => T, onRejected?: (reason: unknown) => T) {
      state.calls.push(query)
      return Promise.resolve()
        .then(() => state.respond(query))
        .then(onFulfilled, onRejected)
    },
  }
  return chain
}

interface FakeState {
  calls: Query[]
  respond: (query: Query) => Result | Promise<Result>
}

function createFakeSupabase() {
  const state: FakeState = { calls: [], respond: () => ok() }
  return Object.assign(state, {
    client: { from: (table: string) => builder(table, state) },
    reset() {
      state.calls.length = 0
      state.respond = () => ok()
    },
    /** Queries of one kind against one table, in the order the route ran them. */
    find(table: string, op?: Op) {
      return state.calls.filter((q) => q.table === table && (!op || q.op === op))
    },
  })
}

export const db = createFakeSupabase()
