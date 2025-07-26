import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /植物監視システム/i,
    })
    
    expect(heading).toBeInTheDocument()
  })
  
  it('renders the system status message', () => {
    render(<Home />)
    
    const statusMessage = screen.getByText(/システムを準備中です/i)
    
    expect(statusMessage).toBeInTheDocument()
  })
  
  it('has proper styling classes', () => {
    render(<Home />)
    
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen', 'bg-gray-50')
  })
})