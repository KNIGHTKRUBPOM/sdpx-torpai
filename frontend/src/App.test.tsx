import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('PairEval app', () => {
  it('renders the product navigation and assignment CTA', () => {
    render(<App />)
    expect(screen.getByText('PairEval')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'เมนูหลัก' })).toBeInTheDocument()
    expect(screen.getByTestId('main-cta')).toHaveTextContent('เริ่มประเมิน')
  })

  it('provides six accessible forced choices for every pair', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('main-cta'))
    expect(screen.getAllByRole('radio')).toHaveLength(18)
    expect(screen.getAllByRole('radio', { name: /ซ้ายดีกว่ามาก/ })).toHaveLength(3)
    expect(screen.queryByRole('radio', { name: /เท่ากัน/ })).not.toBeInTheDocument()
  })

  it('updates progress, announces save state, and submits latest answers', async () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('main-cta'))
    screen.getAllByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ }).forEach((choice) => fireEvent.click(choice))
    expect(screen.getByTestId('evaluation-progress')).toHaveTextContent('3 / 3')
    await waitFor(() => expect(screen.getByText(/บันทึกแล้ว เมื่อ/)).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('submit-evaluation'))
    expect(screen.getByRole('heading', { name: 'ส่งการประเมินแล้ว' })).toBeInTheDocument()
    expect(screen.getByText('16.93')).toBeInTheDocument()
  })

  it('shows incomplete warning when submitting before answering all pairs', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'เริ่มประเมิน' }))

    // Answer only first pair
    const radios = screen.getAllByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
    fireEvent.click(radios[0])
    expect(screen.getByTestId('evaluation-progress')).toHaveTextContent('1 / 3')

    // Click submit
    fireEvent.click(screen.getByRole('button', { name: 'ส่งการประเมิน' }))

    // Expect incomplete alert
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByTestId('incomplete-title')).toHaveTextContent('ยังไม่ได้ตอบ 2 คู่')

    // Confirm submission
    fireEvent.click(screen.getByTestId('confirm-submit-button'))
    expect(screen.getByRole('heading', { name: 'ส่งการประเมินแล้ว' })).toBeInTheDocument()
  })
})
