import { Component, signal, ElementRef, ViewChild, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import JsBarcode from 'jsbarcode';

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

  text1 = signal('SAMPLE1234');
  text2 = signal('PRODUCT567');
  text3 = signal('BATCH890');
  text4 = signal('SERIAL123');
  text5 = signal('ASSET456');
  text6 = signal('ITEM789');

  // Debounce timers for each input
  private debounceTimers: { [key: number]: any } = {};

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // No effects needed - we'll use debounced input handling
  }

  ngAfterViewInit() {
    // Generate initial barcodes after view is initialized
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.generateBarcode(this.text1(), this.barcode1);
        this.generateBarcode(this.text2(), this.barcode2);
        this.generateBarcode(this.text3(), this.barcode3);
        this.generateBarcode(this.text4(), this.barcode4);
        this.generateBarcode(this.text5(), this.barcode5);
        this.generateBarcode(this.text6(), this.barcode6);
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

    // Set new timer to generate barcode after 1 second of no typing
    this.debounceTimers[index] = setTimeout(() => {
      this.generateBarcodeForIndex(index, value);
    }, 1000);
  }

  private generateBarcodeForIndex(index: number, text: string) {
    console.log(`Generating barcode for index ${index} with text:`, text);
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
