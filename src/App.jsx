import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Show a temporary alert message (success or error)
  const showFeedback = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => {
      setMessage({ text: '', type: '' })
    }, 3500)
  }

  // 1. READ: Fetch all items from Supabase
  const loadItems = async () => {
    setFetchLoading(true)
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      showFeedback(`Failed to load items: ${err.message}`, 'error')
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function initialFetch() {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: false })

      if (isMounted) {
        if (error) {
          console.error('Fetch error:', error)
          setMessage({ text: `Failed to load items: ${error.message}`, type: 'error' })
        } else {
          setItems(data || [])
        }
      }
    }

    initialFetch()

    return () => {
      isMounted = false
    }
  }, [])

  // 2. CREATE: Single-input operation to insert a new name into Supabase
  const handleCreate = async (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      showFeedback('Please enter a name before submitting.', 'error')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // UPDATE existing record
        const { error } = await supabase
          .from('items')
          .update({ name: trimmedName })
          .eq('id', editingId)

        if (error) throw error

        showFeedback(`Successfully updated to "${trimmedName}"!`, 'success')
        setEditingId(null)
      } else {
        // CREATE new record (takes only 'name')
        const { error } = await supabase
          .from('items')
          .insert([{ name: trimmedName }])

        if (error) throw error

        showFeedback(`Successfully created name "${trimmedName}"!`, 'success')
      }

      setName('')
      await loadItems()
    } catch (err) {
      console.error('Operation error:', err)
      showFeedback(`Error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 3. EDIT: Pre-fill input for editing
  const handleEdit = (item) => {
    setEditingId(item.id)
    setName(item.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setName('')
  }

  // 4. DELETE: Remove record from Supabase
  const handleDelete = async (id, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) throw error

      showFeedback(`Deleted "${itemName}" successfully!`, 'success')
      if (editingId === id) {
        handleCancelEdit()
      }
      await loadItems()
    } catch (err) {
      console.error('Delete error:', err)
      showFeedback(`Failed to delete: ${err.message}`, 'error')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="badge">Supabase + React</div>
        <h1>CRUD Operations</h1>
        <p className="subtitle">
          Single-input Create operation inserting <code>name</code> into Supabase
        </p>
      </header>

      {/* Status / Feedback Banner */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✓ ' : '⚠ '}
          {message.text}
        </div>
      )}

      {/* CREATE / UPDATE FORM (Single Input taking only name) */}
      <section className="card form-card">
        <h2>{editingId ? 'Edit Name' : 'Create New Name'}</h2>
        <p className="form-desc">
          Enter a name below to insert a new row into the Supabase database.
        </p>

        <form onSubmit={handleCreate} className="input-group">
          <label htmlFor="name-input" className="sr-only">
            Name
          </label>
          <input
            id="name-input"
            type="text"
            className="text-input"
            placeholder="Enter name (e.g. John Doe)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !name.trim()}
          >
            {loading
              ? 'Saving...'
              : editingId
              ? 'Update Name'
              : 'Create / Add Name'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      {/* READ / LIST SECTION */}
      <section className="card list-card">
        <div className="list-header">
          <h2>Items List ({items.length})</h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={loadItems}
            disabled={fetchLoading}
          >
            {fetchLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {fetchLoading ? (
          <div className="loading-state">Loading data from Supabase...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No records found yet.</p>
            <p className="empty-subtitle">
              Type a name above and click <strong>Create / Add Name</strong> to add your first entry!
            </p>
          </div>
        ) : (
          <ul className="items-list">
            {items.map((item) => (
              <li key={item.id} className="item-row">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-meta">
                    ID: #{item.id}
                    {item.created_at && (
                      <> • {new Date(item.created_at).toLocaleString()}</>
                    )}
                  </span>
                </div>
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CODE REFERENCE */}
      <footer className="footer-snippet">
        <p>
          <strong>Supabase Code:</strong>{' '}
          <code>await supabase.from('items').insert([&#123; name &#125;])</code>
        </p>
      </footer>
    </div>
  )
}

export default App
