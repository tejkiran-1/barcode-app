import { Component, signal, ElementRef, ViewChild, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import JsBarcode from 'jsbarcode';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
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

  text1 = signal('');
  text2 = signal('');
  text3 = signal('');
  text4 = signal('');
  text5 = signal('');
  text6 = signal('');

  // Toggle states for each card (false = barcode, true = QR code)
  isQrMode1 = signal(false);
  isQrMode2 = signal(false);
  isQrMode3 = signal(false);
  isQrMode4 = signal(false);
  isQrMode5 = signal(false);
  isQrMode6 = signal(false);

  // Debounce timers for each input
  private debounceTimers: { [key: number]: any } = {};
  
  // localStorage keys
  private readonly STORAGE_KEYS = {
    texts: 'barcode-generator-texts',
    modes: 'barcode-generator-modes'
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Load saved data from localStorage
    this.loadFromStorage();
  }

  ngAfterViewInit() {
    // Generate initial codes after view is initialized
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.generateCodeForIndex(1, this.text1());
        this.generateCodeForIndex(2, this.text2());
        this.generateCodeForIndex(3, this.text3());
        this.generateCodeForIndex(4, this.text4());
        this.generateCodeForIndex(5, this.text5());
        this.generateCodeForIndex(6, this.text6());
      }, 500);
    }
  }

  private generateBarcode(text: string, element: ElementRef<SVGElement> | undefined) {
    if (isPlatformBrowser(this.platformId) && element && element.nativeElement && text && text.trim()) {
      console.log('🔄 Generating barcode for:', text.trim());
      try {
        // Clear previous barcode
        element.nativeElement.innerHTML = '';

        JsBarcode(element.nativeElement, text.trim(), {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          fontOptions: 'bold',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 8,
          background: 'transparent',
          lineColor: '#006BD3'
        });
        console.log('✅ Barcode generated successfully for:', text.trim());
      } catch (error) {
        console.error('❌ Error generating barcode:', error);
        // Display error message in the SVG
        if (element.nativeElement) {
          element.nativeElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="12">Invalid text</text>';
        }
      }
    } else {
      console.log('⏭️  Barcode generation skipped - requirements not met');
    }
  }

  private async generateQRCode(text: string, element: ElementRef<HTMLCanvasElement> | undefined) {
    if (isPlatformBrowser(this.platformId) && element && element.nativeElement && text && text.trim()) {
      console.log('🔄 Generating QR code for:', text.trim());
      try {
        const canvas = element.nativeElement;

        // Set canvas size properly
        canvas.width = 200;
        canvas.height = 200;

        // Clear previous QR code
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        await QRCode.toCanvas(canvas, text.trim(), {
          width: 200,
          color: {
            dark: '#006BD3',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M',
          margin: 2
        });
        console.log('✅ QR code generated successfully for:', text.trim());
      } catch (error) {
        console.error('❌ Error generating QR code:', error);
        // Display error message on canvas
        const canvas = element.nativeElement;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#666';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Error generating QR code', canvas.width / 2, canvas.height / 2 - 10);
          ctx.fillText('Please try different text', canvas.width / 2, canvas.height / 2 + 10);
        }
      }
    } else {
      console.log('⏭️  QR code generation skipped - requirements not met');
    }
  }

  onTextChange(index: number, value: string) {
    console.log(`Text change ${index}:`, value); // Debug log

    // Clear existing timer for this input
    if (this.debounceTimers[index]) {
      clearTimeout(this.debounceTimers[index]);
    }

    // Update the signal immediately
    switch (index) {
      case 1:
        this.text1.set(value);
        break;
      case 2:
        this.text2.set(value);
        break;
      case 3:
        this.text3.set(value);
        break;
      case 4:
        this.text4.set(value);
        break;
      case 5:
        this.text5.set(value);
        break;
      case 6:
        this.text6.set(value);
        break;
    }

    // Save to localStorage immediately
    this.saveToStorage();

    // Set new timer to generate code after 1 second of no typing
    this.debounceTimers[index] = setTimeout(() => {
      this.generateCodeForIndex(index, value);
    }, 1000);
  }

  private generateCodeForIndex(index: number, text: string) {
    console.log(`Generating code for index ${index} with text:`, text);

    const isQrMode = this.getQrModeForIndex(index);

    if (isQrMode) {
      // Generate QR code
      switch (index) {
        case 1:
          this.generateQRCode(text, this.qrcode1);
          break;
        case 2:
          this.generateQRCode(text, this.qrcode2);
          break;
        case 3:
          this.generateQRCode(text, this.qrcode3);
          break;
        case 4:
          this.generateQRCode(text, this.qrcode4);
          break;
        case 5:
          this.generateQRCode(text, this.qrcode5);
          break;
        case 6:
          this.generateQRCode(text, this.qrcode6);
          break;
      }
    } else {
      // Generate barcode
      switch (index) {
        case 1:
          this.generateBarcode(text, this.barcode1);
          break;
        case 2:
          this.generateBarcode(text, this.barcode2);
          break;
        case 3:
          this.generateBarcode(text, this.barcode3);
          break;
        case 4:
          this.generateBarcode(text, this.barcode4);
          break;
        case 5:
          this.generateBarcode(text, this.barcode5);
          break;
        case 6:
          this.generateBarcode(text, this.barcode6);
          break;
      }
    }
  }

  private getQrModeForIndex(index: number): boolean {
    switch (index) {
      case 1: return this.isQrMode1();
      case 2: return this.isQrMode2();
      case 3: return this.isQrMode3();
      case 4: return this.isQrMode4();
      case 5: return this.isQrMode5();
      case 6: return this.isQrMode6();
      default: return false;
    }
  }

  toggleCodeType(index: number) {
    console.log(`Toggling code type for index ${index}`);

    // Toggle the mode
    switch (index) {
      case 1:
        this.isQrMode1.set(!this.isQrMode1());
        break;
      case 2:
        this.isQrMode2.set(!this.isQrMode2());
        break;
      case 3:
        this.isQrMode3.set(!this.isQrMode3());
        break;
      case 4:
        this.isQrMode4.set(!this.isQrMode4());
        break;
      case 5:
        this.isQrMode5.set(!this.isQrMode5());
        break;
      case 6:
        this.isQrMode6.set(!this.isQrMode6());
        break;
    }

    // Save toggle state to localStorage
    this.saveToStorage();

    // Get current text and regenerate code
    const text = this.getTextForIndex(index);
    this.generateCodeForIndex(index, text);
  }

  private getTextForIndex(index: number): string {
    switch (index) {
      case 1: return this.text1();
      case 2: return this.text2();
      case 3: return this.text3();
      case 4: return this.text4();
      case 5: return this.text5();
      case 6: return this.text6();
      default: return '';
    }
  }

  // localStorage methods for data persistence
  private loadFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Load text values
        const savedTexts = localStorage.getItem(this.STORAGE_KEYS.texts);
        if (savedTexts) {
          const texts = JSON.parse(savedTexts);
          this.text1.set(texts.text1 || 'SAMPLE1234');
          this.text2.set(texts.text2 || 'PRODUCT567');
          this.text3.set(texts.text3 || 'BATCH890');
          this.text4.set(texts.text4 || 'SERIAL123');
          this.text5.set(texts.text5 || 'ASSET456');
          this.text6.set(texts.text6 || 'ITEM789');
          console.log('📥 Loaded saved texts from localStorage');
        } else {
          // Set default values if no saved data
          this.setDefaultValues();
        }

        // Load toggle modes
        const savedModes = localStorage.getItem(this.STORAGE_KEYS.modes);
        if (savedModes) {
          const modes = JSON.parse(savedModes);
          this.isQrMode1.set(modes.isQrMode1 || false);
          this.isQrMode2.set(modes.isQrMode2 || false);
          this.isQrMode3.set(modes.isQrMode3 || false);
          this.isQrMode4.set(modes.isQrMode4 || false);
          this.isQrMode5.set(modes.isQrMode5 || false);
          this.isQrMode6.set(modes.isQrMode6 || false);
          console.log('📥 Loaded saved toggle modes from localStorage');
        }
      } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        this.setDefaultValues();
      }
    } else {
      this.setDefaultValues();
    }
  }

  private setDefaultValues(): void {
    this.text1.set('SAMPLE1234');
    this.text2.set('PRODUCT567');
    this.text3.set('BATCH890');
    this.text4.set('SERIAL123');
    this.text5.set('ASSET456');
    this.text6.set('ITEM789');
    console.log('📝 Set default text values');
  }

  private saveToStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Save text values
        const texts = {
          text1: this.text1(),
          text2: this.text2(),
          text3: this.text3(),
          text4: this.text4(),
          text5: this.text5(),
          text6: this.text6()
        };
        localStorage.setItem(this.STORAGE_KEYS.texts, JSON.stringify(texts));

        // Save toggle modes
        const modes = {
          isQrMode1: this.isQrMode1(),
          isQrMode2: this.isQrMode2(),
          isQrMode3: this.isQrMode3(),
          isQrMode4: this.isQrMode4(),
          isQrMode5: this.isQrMode5(),
          isQrMode6: this.isQrMode6()
        };
        localStorage.setItem(this.STORAGE_KEYS.modes, JSON.stringify(modes));
        console.log('💾 Saved data to localStorage');
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
      }
    }
  }

  // Method to clear all saved data (can be called manually if needed)
  clearSavedData(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(this.STORAGE_KEYS.texts);
        localStorage.removeItem(this.STORAGE_KEYS.modes);
        console.log('🗑️ Cleared all saved data from localStorage');
        
        // Reset to default values
        this.setDefaultValues();
        
        // Reset all toggle modes
        this.isQrMode1.set(false);
        this.isQrMode2.set(false);
        this.isQrMode3.set(false);
        this.isQrMode4.set(false);
        this.isQrMode5.set(false);
        this.isQrMode6.set(false);
        
        // Regenerate all codes with default values
        setTimeout(() => {
          this.generateCodeForIndex(1, this.text1());
          this.generateCodeForIndex(2, this.text2());
          this.generateCodeForIndex(3, this.text3());
          this.generateCodeForIndex(4, this.text4());
          this.generateCodeForIndex(5, this.text5());
          this.generateCodeForIndex(6, this.text6());
        }, 100);
      } catch (error) {
        console.error('❌ Error clearing localStorage:', error);
      }
    }
  }
}
