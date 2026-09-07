import { render, screen, fireEvent } from '@testing-library/react';
import FloraApp from '../App';

beforeEach(() => {
  localStorage.clear();
});

// ─── Home screen ──────────────────────────────────────────────────────────────

describe('Home screen', () => {
  test('renders greeting and headline', () => {
    render(<FloraApp />);
    expect(screen.getByText(/Hello, botanist/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('shows scan hero button', () => {
    render(<FloraApp />);
    expect(screen.getByText('New scan')).toBeInTheDocument();
    expect(screen.getByText('📷 Scan')).toBeInTheDocument();
  });

  test('shows today\'s tips section', () => {
    render(<FloraApp />);
    expect(screen.getByText("Today's tips")).toBeInTheDocument();
    expect(screen.getByText('Watering')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  test('does not show library section when library is empty', () => {
    render(<FloraApp />);
    expect(screen.queryByText('My library')).not.toBeInTheDocument();
  });

  test('shows library section when library has plants', () => {
    const plant = {
      id: 1,
      name: 'Monstera Deliciosa',
      family: 'Araceae',
      health: 92,
      lastWateredDate: new Date().toISOString(),
      emoji: '🌿',
      color: '#2D6A4F',
      resultData: {},
    };
    localStorage.setItem('greenie_library', JSON.stringify([plant]));
    render(<FloraApp />);
    expect(screen.getByText('My library')).toBeInTheDocument();
    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('Navigation', () => {
  test('bottom nav has Home, Scan, Map, Library items', () => {
    render(<FloraApp />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getAllByText('Scan').length).toBeGreaterThan(0);
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  test('clicking Library nav shows library screen', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    expect(screen.getByText('My library')).toBeInTheDocument();
  });

  test('clicking Map nav shows map screen', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    expect(screen.getByText('My Home')).toBeInTheDocument();
  });

  test('clicking Home nav returns to home', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    fireEvent.click(screen.getByText('Home'));
    expect(screen.getByText(/Hello, botanist/i)).toBeInTheDocument();
  });

  test('clicking scan hero navigates to scan screen', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('New scan'));
    expect(screen.getByText('🔍 Identify plant')).toBeInTheDocument();
  });
});

// ─── Library screen ───────────────────────────────────────────────────────────

describe('Library screen', () => {
  test('shows empty state when no plants', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    expect(screen.getByText('Empty library')).toBeInTheDocument();
    expect(screen.getByText('Scan a plant to start your collection')).toBeInTheDocument();
  });

  test('shows plant count in subtitle', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    expect(screen.getByText('0 plants saved')).toBeInTheDocument();
  });

  test('shows "1 plant saved" for single plant', () => {
    const plant = {
      id: 1,
      name: 'Fiddle Leaf Fig',
      family: 'Moraceae',
      health: 75,
      lastWateredDate: new Date().toISOString(),
      emoji: '🌿',
      color: '#2D6A4F',
      resultData: {},
    };
    localStorage.setItem('greenie_library', JSON.stringify([plant]));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    expect(screen.getByText('1 plant saved')).toBeInTheDocument();
  });

  test('renders plant cards with name and family', () => {
    const plants = [
      { id: 1, name: 'Monstera', family: 'Araceae', health: 90, lastWateredDate: new Date().toISOString(), emoji: '🌿', color: '#2D6A4F', resultData: {} },
      { id: 2, name: 'Pothos', family: 'Araceae', health: 60, lastWateredDate: new Date().toISOString(), emoji: '🍃', color: '#40916C', resultData: {} },
    ];
    localStorage.setItem('greenie_library', JSON.stringify(plants));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
  });

  test('empty state "Scan now" button navigates to scan screen', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Library'));
    fireEvent.click(screen.getByText('Scan now'));
    expect(screen.getByText('🔍 Identify plant')).toBeInTheDocument();
  });
});

// ─── Map screen ───────────────────────────────────────────────────────────────

describe('Map screen', () => {
  test('shows title and plant/room count', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    expect(screen.getByText('My Home')).toBeInTheDocument();
  });

  test('shows all 6 rooms', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    expect(screen.getByText('Living Room')).toBeInTheDocument();
    expect(screen.getByText('Bedroom')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Bathroom')).toBeInTheDocument();
    expect(screen.getByText('Balcony')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
  });

  test('each room has an Add plant button', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    const addBtns = screen.getAllByText('+ Add plant');
    expect(addBtns).toHaveLength(6);
  });

  test('clicking Add plant opens room sheet', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    const addBtns = screen.getAllByText('+ Add plant');
    fireEvent.click(addBtns[0]);
    expect(screen.getByText('Select a plant to add to this room')).toBeInTheDocument();
  });

  test('sheet shows empty message when no plants', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    const addBtns = screen.getAllByText('+ Add plant');
    fireEvent.click(addBtns[0]);
    expect(screen.getByText("All your plants are already here 🌿")).toBeInTheDocument();
  });

  test('clicking overlay closes the sheet', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Map'));
    fireEvent.click(screen.getAllByText('+ Add plant')[0]);
    expect(screen.getByText('Select a plant to add to this room')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.sheet-overlay'));
    expect(screen.queryByText('Select a plant to add to this room')).not.toBeInTheDocument();
  });
});

// ─── Calendar screen ──────────────────────────────────────────────────────────

describe('Calendar screen', () => {
  test('navigates to calendar screen via Water tab', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('Watering')).toBeInTheDocument();
  });

  test('shows empty state when no plants', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('No plants to track yet')).toBeInTheDocument();
  });

  test('shows plant count in subtitle', () => {
    const plants = [
      { id: 1, name: 'Monstera', family: 'Araceae', health: 90, lastWateredDate: new Date().toISOString(), emoji: '🌿', color: '#2D6A4F', resultData: { care: { water: 'Every 7 days' } } },
    ];
    localStorage.setItem('greenie_library', JSON.stringify(plants));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('1 plants to track')).toBeInTheDocument();
  });

  test('shows 3 view type tabs', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Settimana')).toBeInTheDocument();
    expect(screen.getByText('Mese')).toBeInTheDocument();
  });

  test('shows overdue plant in Overdue group', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const plants = [
      { id: 1, name: 'Pothos', family: 'Araceae', health: 70, lastWateredDate: tenDaysAgo.toISOString(), emoji: '🍃', color: '#40916C', resultData: { care: { water: 'Every 7 days' } } },
    ];
    localStorage.setItem('greenie_library', JSON.stringify(plants));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
  });

  test('Water button moves plant from Overdue to Later', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const plants = [
      { id: 1, name: 'Pothos', family: 'Araceae', health: 70, lastWateredDate: tenDaysAgo.toISOString(), emoji: '🍃', color: '#40916C', resultData: { care: { water: 'Every 7 days' } } },
    ];
    localStorage.setItem('greenie_library', JSON.stringify(plants));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    fireEvent.click(screen.getByText('💧 Water'));
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
  });

  test('plant watered today appears in This week group', () => {
    const today = new Date();
    const plants = [
      { id: 1, name: 'Cactus', family: 'Cactaceae', health: 95, lastWateredDate: today.toISOString(), emoji: '🌵', color: '#52B788', resultData: { care: { water: 'Every 7 days' } } },
    ];
    localStorage.setItem('greenie_library', JSON.stringify(plants));
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Cactus')).toBeInTheDocument();
  });

  test('Settimana view shows 7 day columns', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    fireEvent.click(screen.getByText('Settimana'));
    const cols = document.querySelectorAll('.week-col');
    expect(cols).toHaveLength(7);
  });

  test('Mese view shows month grid and navigation', () => {
    render(<FloraApp />);
    fireEvent.click(screen.getByText('Water'));
    fireEvent.click(screen.getByText('Mese'));
    const cells = document.querySelectorAll('.month-cell');
    expect(cells.length).toBeGreaterThanOrEqual(28);
    expect(document.querySelector('.month-nav-label')).toBeInTheDocument();
  });
});
