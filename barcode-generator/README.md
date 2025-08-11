# Ecolab Barcode Generator

A modern, beautiful Angular web application for generating professional barcodes in real-time. Features a glassmorphism UI design with the Ecolab brand color theme (#006BD3).

## Features

- **Real-time Barcode Generation**: Instantly generates barcodes as you type
- **Six Input Fields**: Six separate input fields for different barcode types:
  - Product Code
  - Batch Number  
  - Serial Number
  - Asset ID
  - Equipment Code
  - Item Code
- **Modern Glassmorphism UI**: Beautiful, translucent design with blur effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Professional Styling**: Clean, attractive interface that draws users in
- **Ecolab Branding**: Uses Ecolab's signature color (#006BD3) throughout the design

## Technology Stack

- **Framework**: Angular 20.1.5
- **Barcode Library**: jsbarcode
- **Styling**: SCSS with modern CSS features
- **Fonts**: Inter font family for clean typography
- **Build Tools**: Angular CLI

## Getting Started

### Prerequisites

- Node.js 22.18.0 or higher
- npm 10.9.3 or higher
- Angular CLI 20.1.5

### Installation

1. Navigate to the project directory:
   ```bash
   cd barcode-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200`

### Available Scripts

- `npm start` or `ng serve` - Starts the development server
- `npm run build` or `ng build` - Builds the project for production
- `npm test` or `ng test` - Runs unit tests
- `npm run lint` - Runs ESLint

## Usage

1. **Enter Text**: Type any text into one of the six input fields
2. **Real-time Generation**: Barcodes are generated automatically as you type
3. **Multiple Barcodes**: Use all six fields to generate multiple barcodes simultaneously
4. **Professional Output**: Each barcode is generated in CODE128 format with proper styling

## Design Features

### Glassmorphism UI
- Translucent containers with backdrop blur effects
- Subtle borders and shadows
- Modern, clean aesthetic

### Color Scheme
- Primary: #006BD3 (Ecolab Blue)
- Secondary: #4A90E2 (Light Blue)
- Gradients and transparency effects throughout

### Animations
- Floating particles background animation
- Smooth hover transitions
- Interactive input field effects

### Responsive Layout
- Mobile-first design approach
- Flexible grid system
- Optimized for all screen sizes

## Project Structure

```
barcode-generator/
├── src/
│   ├── app/
│   │   ├── app.ts          # Main component logic
│   │   ├── app.html        # Template with glassmorphism UI
│   │   └── app.scss        # Modern styling with Ecolab theme
│   ├── public/             # Static assets
│   └── main.ts            # Application bootstrap
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Customization

### Colors
Update the CSS custom properties in `app.scss` to change the color scheme:

```scss
:host {
  --primary-color: #006BD3;    # Main Ecolab blue
  --primary-light: #4A90E2;    # Lighter shade
  --primary-dark: #004B9A;     # Darker shade
}
```

### Barcode Settings
Modify barcode generation options in the `generateBarcode` method in `app.ts`:

```typescript
JsBarcode(element.nativeElement, text, {
  format: 'CODE128',      // Barcode format
  width: 2,              // Bar width
  height: 60,            # Bar height
  displayValue: true,    # Show text below barcode
  fontSize: 12,          # Text font size
  lineColor: '#006BD3'   # Bar color
});
```

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lightweight build with tree-shaking
- Optimized bundle size
- Fast barcode generation
- Smooth animations with CSS transforms

---

**Powered by Ecolab Technology** 🚀
