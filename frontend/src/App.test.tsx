import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { App } from './App'

describe('App Component', () => {
  it('renders application header and title', () => {
    render(<App />)
    expect(screen.getByText(/ระบบยืม-คืนหนังสือดิจิทัล/i)).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/ค้นหาชื่อหนังสือ, ผู้แต่ง, หรือ ISBN.../i)).toBeInTheDocument()
  })
})
