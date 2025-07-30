import { createClient } from '@supabase/supabase-js'

// Environment variables - these should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ'

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with modern configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

// Helper functions for common operations
export const auth = supabase.auth
export const db = supabase.from

// Custom error handler
export const handleSupabaseError = (error) => {
    console.error('Supabase error:', error)

    if (error.code === 'PGRST116') {
        return { error: 'No rows returned' }
    }

    if (error.code === '23505') {
        return { error: 'Duplicate entry' }
    }

    return { error: error.message || 'An unexpected error occurred' }
}

// Database helper functions
export const databaseHelpers = {
    // Generic insert function
    async insert(table, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select()

            if (error) throw error
            return { data: result, error: null }
        } catch (error) {
            return { data: null, error: handleSupabaseError(error) }
        }
    },

    // Generic select function
    async select(table, options = {}) {
        try {
            let query = supabase.from(table).select(options.select || '*')

            if (options.where) {
                Object.entries(options.where).forEach(([key, value]) => {
                    query = query.eq(key, value)
                })
            }

            if (options.orderBy) {
                query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
            }

            if (options.limit) {
                query = query.limit(options.limit)
            }

            const { data, error } = await query

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error: handleSupabaseError(error) }
        }
    },

    // Generic update function
    async update(table, data, where) {
        try {
            let query = supabase.from(table).update(data)

            if (where) {
                Object.entries(where).forEach(([key, value]) => {
                    query = query.eq(key, value)
                })
            }

            const { data: result, error } = await query.select()

            if (error) throw error
            return { data: result, error: null }
        } catch (error) {
            return { data: null, error: handleSupabaseError(error) }
        }
    },

    // Generic delete function
    async delete(table, where) {
        try {
            let query = supabase.from(table).delete()

            if (where) {
                Object.entries(where).forEach(([key, value]) => {
                    query = query.eq(key, value)
                })
            }

            const { data, error } = await query

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error: handleSupabaseError(error) }
        }
    }
}

export default supabase
