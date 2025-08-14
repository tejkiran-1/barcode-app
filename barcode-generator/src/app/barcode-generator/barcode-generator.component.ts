import { Component, signal, ElementRef, ViewChild, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import JsBarcode from 'jsbarcode';
import * as QRCode from 'qrcode';

@Component({
    selector: 'app-barcode-generator',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './barcode-generator.component.html',
    styleUrl: './barcode-generator.component.scss'
})
export class BarcodeGeneratorComponent implements AfterViewInit {
    protected readonly title = signal('Ecolab Barcode Generator');

    @ViewChild('barcode1', { static: false }) barcode1!: ElementRef<SVGElement>;
    @ViewChild('barcode2', { static: false }) barcode2!: ElementRef<SVGElement>;
    @ViewChild('barcode3', { static: false }) barcode3!: ElementRef<SVGElement>;
    @ViewChild('barcode4', { static: false }) barcode4!: ElementRef<SVGElement>;
    @ViewChild('barcode5', { static: false }) barcode5!: ElementRef<SVGElement>;
    @ViewChild('barcode6', { static: false }) barcode6!: ElementRef<SVGElement>;

    @ViewChild('qrcode1', { static: false }) qrcode1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('qrcode2', { static: false }) qrcode2!: ElementRef<HTMLCanvasElement>;
    @ViewChild('qrcode3', { static: false }) qrcode3!: ElementRef<HTMLCanvasElement>;
    @ViewChild('qrcode4', { static: false }) qrcode4!: ElementRef<HTMLCanvasElement>;
    @ViewChild('qrcode5', { static: false }) qrcode5!: ElementRef<HTMLCanvasElement>;
    @ViewChild('qrcode6', { static: false }) qrcode6!: ElementRef<HTMLCanvasElement>;

    text1 = signal('SAMPLE1234');
    text2 = signal('PRODUCT567');
    text3 = signal('BATCH890');
    text4 = signal('ORDER123');
    text5 = signal('SERIAL456');
    text6 = signal('INVOICE789');

    // Theme color signal
    themeColor = signal('#006BD3');

    // Toggle states for each card (false = barcode, true = QR code)
    isQrMode1 = signal(false);
    isQrMode2 = signal(false);
    isQrMode3 = signal(false);
    isQrMode4 = signal(false);
    isQrMode5 = signal(false);
    isQrMode6 = signal(false);

    // Debounce timers for each input
    private debounceTimers: { [key: number]: any } = {};

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private router: Router
    ) { }

    ngAfterViewInit(): void {
        // Load saved data
        this.loadSavedData();

        // Load saved theme color with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.loadThemeColor();
        }, 50);

        // Initialize barcodes for all cards
        if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
                this.generateBarcode(1, this.text1());
                this.generateBarcode(2, this.text2());
                this.generateBarcode(3, this.text3());
                this.generateBarcode(4, this.text4());
                this.generateBarcode(5, this.text5());
                this.generateBarcode(6, this.text6());
            }, 100);
        }
    }

    /**
     * Load theme color from localStorage
     */
    private loadThemeColor(): void {
        try {
            // Check if we're running in the browser
            if (typeof localStorage !== 'undefined') {
                const savedColor = localStorage.getItem('barcode_theme_color');
                if (savedColor) {
                    console.log('Loading saved color:', savedColor); // Debug log
                    this.themeColor.set(savedColor);
                    this.updateThemeColors(savedColor);
                } else {
                    console.log('No saved color found, using default'); // Debug log
                    // Set default color
                    this.updateThemeColors(this.themeColor());
                }
            } else {
                // Set default color for SSR
                this.updateThemeColors(this.themeColor());
            }
        } catch (error) {
            console.warn('Failed to load theme color:', error);
            // Fallback to default
            this.updateThemeColors(this.themeColor());
        }
    }

    /**
     * Load saved data from localStorage
     */
    private loadSavedData(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                // Load text values
                const savedText1 = localStorage.getItem('barcode_text_1');
                const savedText2 = localStorage.getItem('barcode_text_2');
                const savedText3 = localStorage.getItem('barcode_text_3');
                const savedText4 = localStorage.getItem('barcode_text_4');
                const savedText5 = localStorage.getItem('barcode_text_5');
                const savedText6 = localStorage.getItem('barcode_text_6');

                if (savedText1 !== null) this.text1.set(savedText1);
                if (savedText2 !== null) this.text2.set(savedText2);
                if (savedText3 !== null) this.text3.set(savedText3);
                if (savedText4 !== null) this.text4.set(savedText4);
                if (savedText5 !== null) this.text5.set(savedText5);
                if (savedText6 !== null) this.text6.set(savedText6);

                // Load toggle states
                const savedMode1 = localStorage.getItem('barcode_mode_1');
                const savedMode2 = localStorage.getItem('barcode_mode_2');
                const savedMode3 = localStorage.getItem('barcode_mode_3');
                const savedMode4 = localStorage.getItem('barcode_mode_4');
                const savedMode5 = localStorage.getItem('barcode_mode_5');
                const savedMode6 = localStorage.getItem('barcode_mode_6');

                if (savedMode1 !== null) this.isQrMode1.set(savedMode1 === 'true');
                if (savedMode2 !== null) this.isQrMode2.set(savedMode2 === 'true');
                if (savedMode3 !== null) this.isQrMode3.set(savedMode3 === 'true');
                if (savedMode4 !== null) this.isQrMode4.set(savedMode4 === 'true');
                if (savedMode5 !== null) this.isQrMode5.set(savedMode5 === 'true');
                if (savedMode6 !== null) this.isQrMode6.set(savedMode6 === 'true');
            }
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }

    /**
     * Save data to localStorage
     */
    private saveData(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                // Save text values
                localStorage.setItem('barcode_text_1', this.text1());
                localStorage.setItem('barcode_text_2', this.text2());
                localStorage.setItem('barcode_text_3', this.text3());
                localStorage.setItem('barcode_text_4', this.text4());
                localStorage.setItem('barcode_text_5', this.text5());
                localStorage.setItem('barcode_text_6', this.text6());

                // Save toggle states
                localStorage.setItem('barcode_mode_1', this.isQrMode1().toString());
                localStorage.setItem('barcode_mode_2', this.isQrMode2().toString());
                localStorage.setItem('barcode_mode_3', this.isQrMode3().toString());
                localStorage.setItem('barcode_mode_4', this.isQrMode4().toString());
                localStorage.setItem('barcode_mode_5', this.isQrMode5().toString());
                localStorage.setItem('barcode_mode_6', this.isQrMode6().toString());
            }
        } catch (error) {
            console.warn('Failed to save data:', error);
        }
    }

    /**
     * Handle color change
     */
    onColorChange(color: string): void {
        console.log('Color changed to:', color); // Debug log
        this.themeColor.set(color);

        // Update all color variables on the host element
        this.updateThemeColors(color);

        // Regenerate all barcodes and QR codes with new color
        this.regenerateAllCodes();

        try {
            // Check if we're running in the browser
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('barcode_theme_color', color);
                console.log('Color saved to localStorage:', color); // Debug log
            }
        } catch (error) {
            console.warn('Failed to save theme color:', error);
        }
    }

    /**
     * Regenerate all barcodes and QR codes with current theme color
     */
    private regenerateAllCodes(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        setTimeout(() => {
            this.generateBarcode(1, this.text1());
            this.generateBarcode(2, this.text2());
            this.generateBarcode(3, this.text3());
            this.generateBarcode(4, this.text4());
            this.generateBarcode(5, this.text5());
            this.generateBarcode(6, this.text6());
        }, 100);
    }

    /**
     * Update theme colors throughout the application
     */
    private updateThemeColors(color: string): void {
        if (typeof document === 'undefined') return;

        try {
            // Update CSS custom properties on the host element
            const hostElement = document.querySelector('app-barcode-generator');
            if (hostElement) {
                const element = hostElement as HTMLElement;
                element.style.setProperty('--primary-color', color);

                // Generate color variations
                const lightColor = this.mixColors(color, '#ffffff', 0.3);
                const darkColor = this.mixColors(color, '#000000', 0.3);

                element.style.setProperty('--primary-light', lightColor);
                element.style.setProperty('--primary-dark', darkColor);
                element.style.setProperty('--scary-blue', color);
                element.style.setProperty('--scary-light-blue', lightColor);

                // Update gradients
                element.style.setProperty('--gradient-1', `linear-gradient(135deg, ${color} 0%, ${lightColor} 100%)`);
                element.style.setProperty('--shadow-light', `${color}1A`); // 10% opacity
                element.style.setProperty('--shadow-medium', `${color}33`); // 20% opacity
                element.style.setProperty('--shadow-heavy', `${color}4D`); // 30% opacity
                element.style.setProperty('--scary-shadow', `${color}33`);
            }
        } catch (error) {
            console.warn('Failed to update theme colors:', error);
        }
    }

    /**
     * Mix two colors (simple hex color mixing)
     */
    private mixColors(color1: string, color2: string, ratio: number): string {
        try {
            // Convert hex to RGB
            const hex1 = color1.replace('#', '');
            const hex2 = color2.replace('#', '');

            const r1 = parseInt(hex1.substring(0, 2), 16);
            const g1 = parseInt(hex1.substring(2, 4), 16);
            const b1 = parseInt(hex1.substring(4, 6), 16);

            const r2 = parseInt(hex2.substring(0, 2), 16);
            const g2 = parseInt(hex2.substring(2, 4), 16);
            const b2 = parseInt(hex2.substring(4, 6), 16);

            // Mix colors
            const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
            const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
            const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

            // Convert back to hex
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } catch (error) {
            console.warn('Color mixing failed:', error);
            return color1; // Fallback to original color
        }
    }

    /**
     * Handle text input changes with debouncing
     */
    onTextChange(cardNumber: number, text: string): void {
        // Update the signal immediately for UI responsiveness
        switch (cardNumber) {
            case 1: this.text1.set(text); break;
            case 2: this.text2.set(text); break;
            case 3: this.text3.set(text); break;
            case 4: this.text4.set(text); break;
            case 5: this.text5.set(text); break;
            case 6: this.text6.set(text); break;
        }

        // Save data to localStorage
        this.saveData();

        // Clear existing timer
        if (this.debounceTimers[cardNumber]) {
            clearTimeout(this.debounceTimers[cardNumber]);
        }

        // Set new timer for barcode generation
        this.debounceTimers[cardNumber] = setTimeout(() => {
            this.generateBarcode(cardNumber, text);
        }, 300);
    }

    /**
     * Toggle between barcode and QR code
     */
    toggleCodeType(cardNumber: number): void {
        let currentMode: boolean;
        let text: string;

        switch (cardNumber) {
            case 1:
                currentMode = this.isQrMode1();
                this.isQrMode1.set(!currentMode);
                text = this.text1();
                break;
            case 2:
                currentMode = this.isQrMode2();
                this.isQrMode2.set(!currentMode);
                text = this.text2();
                break;
            case 3:
                currentMode = this.isQrMode3();
                this.isQrMode3.set(!currentMode);
                text = this.text3();
                break;
            case 4:
                currentMode = this.isQrMode4();
                this.isQrMode4.set(!currentMode);
                text = this.text4();
                break;
            case 5:
                currentMode = this.isQrMode5();
                this.isQrMode5.set(!currentMode);
                text = this.text5();
                break;
            case 6:
                currentMode = this.isQrMode6();
                this.isQrMode6.set(!currentMode);
                text = this.text6();
                break;
            default: return;
        }

        // Save data to localStorage
        this.saveData();

        // Generate the appropriate code type
        setTimeout(() => {
            this.generateBarcode(cardNumber, text);
        }, 50);
    }

    /**
     * Generate barcode or QR code based on current mode
     */
    private generateBarcode(cardNumber: number, text: string): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const isQrMode = this.getQrMode(cardNumber);

        if (isQrMode) {
            this.generateQRCode(cardNumber, text);
        } else {
            this.generateBarcodeOnly(cardNumber, text);
        }
    }

    /**
     * Get QR mode for a specific card
     */
    private getQrMode(cardNumber: number): boolean {
        switch (cardNumber) {
            case 1: return this.isQrMode1();
            case 2: return this.isQrMode2();
            case 3: return this.isQrMode3();
            case 4: return this.isQrMode4();
            case 5: return this.isQrMode5();
            case 6: return this.isQrMode6();
            default: return false;
        }
    }

    /**
     * Generate barcode using JsBarcode
     */
    private generateBarcodeOnly(cardNumber: number, text: string): void {
        const barcodeElement = this.getBarcodeElement(cardNumber);
        if (!barcodeElement) return;

        try {
            if (text.trim()) {
                JsBarcode(barcodeElement, text, {
                    format: 'CODE128',
                    width: 2,
                    height: 80,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                    background: '#ffffff',
                    lineColor: this.themeColor() // Use theme color for barcode lines
                });
            } else {
                // Clear barcode if no text
                barcodeElement.innerHTML = '';
            }
        } catch (error) {
            console.warn(`Error generating barcode for card ${cardNumber}:`, error);
            barcodeElement.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="${this.themeColor()}" font-size="12">Invalid input</text>`;
        }
    }

    /**
     * Generate QR code using qrcode library
     */
    private generateQRCode(cardNumber: number, text: string): void {
        const qrElement = this.getQRElement(cardNumber);
        if (!qrElement) return;

        try {
            if (text.trim()) {
                QRCode.toCanvas(qrElement, text, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: this.themeColor(), // Use theme color for QR code dark areas
                        light: '#ffffff'
                    }
                });
            } else {
                // Clear QR code if no text
                const ctx = qrElement.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, qrElement.width, qrElement.height);
                }
            }
        } catch (error) {
            console.warn(`Error generating QR code for card ${cardNumber}:`, error);
            const ctx = qrElement.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, qrElement.width, qrElement.height);
                ctx.fillStyle = this.themeColor(); // Use theme color for error text
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Invalid input', qrElement.width / 2, qrElement.height / 2);
            }
        }
    }

    /**
     * Get barcode element by card number
     */
    private getBarcodeElement(cardNumber: number): SVGElement | null {
        switch (cardNumber) {
            case 1: return this.barcode1?.nativeElement || null;
            case 2: return this.barcode2?.nativeElement || null;
            case 3: return this.barcode3?.nativeElement || null;
            case 4: return this.barcode4?.nativeElement || null;
            case 5: return this.barcode5?.nativeElement || null;
            case 6: return this.barcode6?.nativeElement || null;
            default: return null;
        }
    }

    /**
     * Get QR element by card number
     */
    private getQRElement(cardNumber: number): HTMLCanvasElement | null {
        switch (cardNumber) {
            case 1: return this.qrcode1?.nativeElement || null;
            case 2: return this.qrcode2?.nativeElement || null;
            case 3: return this.qrcode3?.nativeElement || null;
            case 4: return this.qrcode4?.nativeElement || null;
            case 5: return this.qrcode5?.nativeElement || null;
            case 6: return this.qrcode6?.nativeElement || null;
            default: return null;
        }
    }

    /**
     * Navigate to shipment manager
     */
    goToShipmentManager(): void {
        this.router.navigate(['/shipment-manager']);
    }
}
