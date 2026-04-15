const API_URL = import.meta.env.VITE_API_URL || 'https://www.gemmapascual.es/Programacion/api/api.php';

const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) return { data: null, error: data };
    return { data, error: null };
};

class SupabaseQueryBuilder {
    constructor(table) {
        this.table = table;
        this.params = new URLSearchParams({ table });
        this.method = 'GET';
        this.body = null;
    }

    select(columns = '*') { return this; } // PHP API currently handles all cols or filtered via query
    
    eq(column, value) {
        this.params.append(column, value);
        return this;
    }

    in(column, values) {
        values.forEach(v => this.params.append(`${column}[]`, v));
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.params.append('order_by', column);
        this.params.append('order_dir', ascending ? 'ASC' : 'DESC');
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    insert(data) {
        this.method = 'POST';
        this.body = JSON.stringify(Array.isArray(data) ? data[0] : data);
        return this;
    }

    update(data) {
        this.method = 'PUT';
        this.body = JSON.stringify(data);
        return this;
    }

    delete() {
        this.method = 'DELETE';
        return this;
    }

    async then(resolve) {
        const url = `${API_URL}?${this.params.toString()}${this.isSingle ? '&single=1' : ''}`;
        const result = await apiRequest(url, {
            method: this.method,
            body: this.body
        });
        resolve(result);
    }
}

export const supabase = {
    from: (table) => new SupabaseQueryBuilder(table),
    auth: {
        getSession: async () => {
            const user = JSON.parse(localStorage.getItem('auth_user'));
            return { data: { session: user ? { user } : null }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            const result = await apiRequest(`${API_URL}?path=login`, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (result.data) {
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('auth_user', JSON.stringify(result.data.user));
            }
            return { data: result.data, error: result.error };
        },
        signOut: async () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            return { error: null };
        },
        onAuthStateChange: (callback) => {
            // Mock subscription
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
    }
};

