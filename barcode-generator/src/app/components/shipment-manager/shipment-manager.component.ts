import { Component, signal, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import JsBarcode from 'jsbarcode';
import * as QRCode from 'qrcode';

import {
    ShipmentService,
    ShipmentDeliveryRequest,
    DeliveryType,
    ContainerItem,
    BulkItem,
    ShipmentResponse,
    ApiConfig,
    DeliveryResponse
} from '../../services/shipment.service';

/**
 * Interface for modal state management
 */
interface ModalState {
    isVisible: boolean;
    type: 'not-found' | 'api-config' | 'success' | 'error';
    title: string;
    message: string;
    showApiConfig?: boolean;
}

/**
 * Shipment Manager Component
 * Handles creation and viewing of shipment deliveries with barcode generation
 */
@Component({
    selector: 'app-shipment-manager',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './shipment-manager.component.html',
    styleUrls: ['./shipment-manager.component.scss']
})
export class ShipmentManagerComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Theme management
    themeColor = signal('#006BD3');

    // Tab management
    activeTab = signal<'view' | 'create'>('view');

    // Loading states
    isLoading = signal(false);
    isSearching = signal(false);
    isSaving = signal(false);

    // View tab data
    searchNumber = signal('');
    currentShipment = signal<ShipmentResponse | null>(null);

    // Toggle states for deliveries and items (QR vs Barcode)
    deliveryToggleStates = signal<{ [key: string]: boolean }>({});
    itemToggleStates = signal<{ [key: string]: boolean }>({});

    // Create tab data
    createForm = {
        shipmentNumber: '',
        deliveryNumber: '',
        deliveryType: DeliveryType.Container,
        containerItems: [{ materialNumber: '', serialNumber: '' }] as ContainerItem[],
        bulkItems: [{ materialNumber: '', evdSealNumber: '' }] as BulkItem[]
    };

    // Modal state
    modalState = signal<ModalState>({
        isVisible: false,
        type: 'not-found',
        title: '',
        message: ''
    });

    // API Configuration
    apiConfig = {
        baseUrl: '',
        bearerToken: ''
    };

    // Form validation errors
    validationErrors = signal<string[]>([]);

    // Delivery type enum for template
    DeliveryType = DeliveryType;

    // Barcode generation references
    @ViewChild('barcodeContainer', { read: ElementRef }) barcodeContainer!: ElementRef;

    constructor(
        private shipmentService: ShipmentService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        // Load current theme from parent or localStorage
        this.loadTheme();

        // Load current API config
        this.loadApiConfig();

        // Load saved search value
        this.loadSavedSearchValue();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load theme color from localStorage or use default
     */
    private loadTheme(): void {
        try {
            // Check if we're running in the browser
            if (typeof localStorage !== 'undefined') {
                const savedTheme = localStorage.getItem('barcode_theme_color');
                if (savedTheme) {
                    this.themeColor.set(savedTheme);
                    this.updateThemeColors();
                } else {
                    this.updateThemeColors();
                }
            } else {
                this.updateThemeColors();
            }
        } catch (error) {
            console.warn('Failed to load theme:', error);
            this.updateThemeColors();
        }
    }

    /**
     * Load API configuration
     */
    private loadApiConfig(): void {
        const config = this.shipmentService.getApiConfig();
        this.apiConfig.baseUrl = config.baseUrl;
        this.apiConfig.bearerToken = config.bearerToken || '';
    }

    /**
     * Load saved search value from localStorage
     */
    private loadSavedSearchValue(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                const savedSearch = localStorage.getItem('shipment_search_value');
                if (savedSearch) {
                    this.searchNumber.set(savedSearch);
                }
            }
        } catch (error) {
            console.warn('Failed to load saved search value:', error);
        }
    }

    /**
     * Save search value to localStorage
     */
    private saveSearchValue(value: string): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('shipment_search_value', value);
            }
        } catch (error) {
            console.warn('Failed to save search value:', error);
        }
    }

    /**
     * Change theme color
     * @param color - New theme color
     */
    onThemeChange(color: string): void {
        this.themeColor.set(color);
        this.updateThemeColors();
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('barcode_theme_color', color);
            }
        } catch (error) {
            console.warn('Failed to save theme:', error);
        }
    }

    /**
     * Handle color change - enhanced version matching barcode generator
     */
    onColorChange(color: string): void {
        console.log('Color changed to:', color);
        this.themeColor.set(color);

        // Update all color variables on the host element
        this.updateThemeColors();

        // Regenerate barcodes if any exist
        this.regenerateBarcodes();

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('barcode_theme_color', color);
                console.log('Color saved to localStorage:', color);
            }
        } catch (error) {
            console.warn('Failed to save theme color:', error);
        }
    }

    /**
     * Update theme colors throughout the application
     */
    private updateThemeColors() {
        // Check if we're in a browser environment
        if (typeof document === 'undefined') {
            return;
        }

        const root = document.documentElement;
        const themeColor = this.themeColor();

        root.style.setProperty('--theme-color', themeColor);

        // Convert hex to RGB for rgba usage
        const hex = themeColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        root.style.setProperty('--theme-color-rgb', `${r}, ${g}, ${b}`);

        // Create lighter variant for gradients
        const lighterColor = this.lightenColor(themeColor, 20);
        root.style.setProperty('--theme-color-light', lighterColor);

        // Save theme color to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('shipmentThemeColor', themeColor);
        }
    }

    private lightenColor(color: string, percent: number): string {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const lighten = (channel: number) => Math.min(255, Math.floor(channel + (255 - channel) * (percent / 100)));

        const newR = lighten(r).toString(16).padStart(2, '0');
        const newG = lighten(g).toString(16).padStart(2, '0');
        const newB = lighten(b).toString(16).padStart(2, '0');

        return `#${newR}${newG}${newB}`;
    }    /**
     * Mix two colors with a given ratio
     */
    private mixColors(color1: string, color2: string, ratio: number): string {
        try {
            const hex = (color: string) => color.replace('#', '');
            const r1 = parseInt(hex(color1).substr(0, 2), 16);
            const g1 = parseInt(hex(color1).substr(2, 2), 16);
            const b1 = parseInt(hex(color1).substr(4, 2), 16);

            const r2 = parseInt(hex(color2).substr(0, 2), 16);
            const g2 = parseInt(hex(color2).substr(2, 2), 16);
            const b2 = parseInt(hex(color2).substr(4, 2), 16);

            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);

            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } catch (error) {
            console.warn('Error mixing colors:', error);
            return color1;
        }
    }

    /**
     * Regenerate barcodes with current theme color
     */
    private regenerateBarcodes(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        // Only regenerate if we have a current shipment with barcodes
        const currentShipment = this.currentShipment();
        if (currentShipment) {
            setTimeout(() => {
                this.generateBarcodesForShipment(currentShipment);
            }, 100);
        }
    }

    /**
     * Switch between view and create tabs
     * @param tab - Tab to switch to
     */
    switchTab(tab: 'view' | 'create'): void {
        this.activeTab.set(tab);
        this.clearValidationErrors();

        if (tab === 'create') {
            this.resetCreateForm();
        }
    }

    /**
     * Navigate back to main barcode generator
     */
    goBack(): void {
        this.router.navigate(['/']);
    }

    /**
     * Toggle between barcode and QR code for a delivery
     */
    toggleDeliveryCode(deliveryNumber: string): void {
        const currentStates = this.deliveryToggleStates();
        const newStates = { ...currentStates };
        newStates[deliveryNumber] = !newStates[deliveryNumber];
        this.deliveryToggleStates.set(newStates);
    }

    /**
     * Check if delivery should show QR code
     */
    isDeliveryQrMode(deliveryNumber: string): boolean {
        return this.deliveryToggleStates()[deliveryNumber] || false;
    }

    /**
     * Toggle between barcode and QR code for an item
     */
    toggleItemCode(itemId: string): void {
        const currentStates = this.itemToggleStates();
        const newStates = { ...currentStates };
        newStates[itemId] = !newStates[itemId];
        this.itemToggleStates.set(newStates);
    }

    /**
     * Check if item should show QR code
     */
    isItemQrMode(itemId: string): boolean {
        return this.itemToggleStates()[itemId] || false;
    }

    /**
     * TrackBy function for delivery ngFor
     */
    trackByDeliveryNumber(index: number, delivery: any): string {
        return delivery.deliveryNumber;
    }

    /**
     * TrackBy function for item ngFor
     */
    trackByItemIndex(index: number, item: any): number {
        return index;
    }

    // =============== VIEW TAB METHODS ===============

    /**
     * Search for shipment/delivery by number
     */
    searchShipment(): void {
        const searchTerm = this.searchNumber().trim();

        if (!searchTerm) {
            this.showModal({
                type: 'error',
                title: 'Search Error',
                message: 'Please enter a shipment or delivery number to search.'
            });
            return;
        }

        // Save the search value to localStorage
        this.saveSearchValue(searchTerm);

        this.isSearching.set(true);
        this.currentShipment.set(null);

        this.shipmentService.searchByNumber(searchTerm)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSearching.set(false))
            )
            .subscribe({
                next: (shipment: ShipmentResponse) => {
                    this.currentShipment.set(shipment);
                    setTimeout(() => this.generateBarcodesForShipment(shipment), 100);
                },
                error: (error: any) => {
                    if (error.status === 404) {
                        this.showNotFoundModal();
                    } else {
                        this.showModal({
                            type: 'error',
                            title: 'Search Error',
                            message: error.message || 'Failed to search for shipment/delivery.'
                        });
                    }
                }
            });
    }

    /**
     * Generate barcodes for the current shipment
     * @param shipment - Shipment data
     */
    private generateBarcodesForShipment(shipment: ShipmentResponse): void {
        if (!isPlatformBrowser(this.platformId) || !this.barcodeContainer) {
            return;
        }

        setTimeout(() => {
            const container = this.barcodeContainer.nativeElement;
            const barcodeElements = container.querySelectorAll('.barcode-svg');
            const qrElements = container.querySelectorAll('.qr-canvas');

            // Generate shipment barcode
            const shipmentBarcode = container.querySelector(`#shipment-barcode-${shipment.shipmentNumber.replace(/[^a-zA-Z0-9]/g, '')}`);
            if (shipmentBarcode) {
                try {
                    JsBarcode(shipmentBarcode, shipment.shipmentNumber, {
                        format: 'CODE128',
                        width: 2,
                        height: 50,
                        displayValue: true,
                        fontSize: 12,
                        margin: 5,
                        background: '#ffffff',
                        lineColor: this.themeColor()
                    });
                } catch (error) {
                    console.warn('Failed to generate shipment barcode:', error);
                }
            }

            // Generate delivery barcodes and QR codes
            shipment.deliveries.forEach((delivery: DeliveryResponse) => {
                const deliveryId = delivery.deliveryNumber.replace(/[^a-zA-Z0-9]/g, '');
                const deliveryBarcode = container.querySelector(`#delivery-barcode-${deliveryId}`);
                const deliveryQr = container.querySelector(`#delivery-qr-${deliveryId}`) as HTMLCanvasElement;

                // Generate delivery barcode
                if (deliveryBarcode) {
                    try {
                        JsBarcode(deliveryBarcode, delivery.deliveryNumber, {
                            format: 'CODE128',
                            width: 2,
                            height: 50,
                            displayValue: true,
                            fontSize: 12,
                            margin: 5,
                            background: '#ffffff',
                            lineColor: this.themeColor()
                        });
                    } catch (error) {
                        console.warn('Failed to generate delivery barcode:', error);
                    }
                }

                // Generate delivery QR code
                if (deliveryQr) {
                    try {
                        QRCode.toCanvas(deliveryQr, delivery.deliveryNumber, {
                            width: 150,
                            margin: 2,
                            color: {
                                dark: this.themeColor(),
                                light: '#FFFFFF'
                            }
                        });
                    } catch (error) {
                        console.warn('Failed to generate delivery QR code:', error);
                    }
                }

                // Generate item barcodes/QR codes
                if (delivery.containerItems) {
                    delivery.containerItems.forEach((item: ContainerItem, index: number) => {
                        const itemId = `${deliveryId}-container-${index}`;

                        // Generate material number barcode
                        const materialBarcode = container.querySelector(`#material-barcode-${itemId}`);
                        if (materialBarcode) {
                            try {
                                JsBarcode(materialBarcode, item.materialNumber, {
                                    format: 'CODE128',
                                    width: 1.5,
                                    height: 40,
                                    displayValue: true,
                                    fontSize: 10,
                                    margin: 3,
                                    background: '#ffffff',
                                    lineColor: this.themeColor()
                                });
                            } catch (error) {
                                console.warn('Failed to generate material barcode:', error);
                            }
                        }

                        // Generate material number QR code
                        const materialQr = container.querySelector(`#material-qr-${itemId}`) as HTMLCanvasElement;
                        if (materialQr) {
                            try {
                                QRCode.toCanvas(materialQr, item.materialNumber, {
                                    width: 80,
                                    margin: 1,
                                    color: {
                                        dark: this.themeColor(),
                                        light: '#FFFFFF'
                                    }
                                });
                            } catch (error) {
                                console.warn('Failed to generate material QR code:', error);
                            }
                        }

                        // Generate serial number barcode
                        const serialBarcode = container.querySelector(`#serial-barcode-${itemId}`);
                        if (serialBarcode) {
                            try {
                                JsBarcode(serialBarcode, item.serialNumber, {
                                    format: 'CODE128',
                                    width: 1.5,
                                    height: 40,
                                    displayValue: true,
                                    fontSize: 10,
                                    margin: 3,
                                    background: '#ffffff',
                                    lineColor: this.themeColor()
                                });
                            } catch (error) {
                                console.warn('Failed to generate serial barcode:', error);
                            }
                        }

                        // Generate serial number QR code
                        const serialQr = container.querySelector(`#serial-qr-${itemId}`) as HTMLCanvasElement;
                        if (serialQr) {
                            try {
                                QRCode.toCanvas(serialQr, item.serialNumber, {
                                    width: 80,
                                    margin: 1,
                                    color: {
                                        dark: this.themeColor(),
                                        light: '#FFFFFF'
                                    }
                                });
                            } catch (error) {
                                console.warn('Failed to generate serial QR code:', error);
                            }
                        }
                    });
                }

                if (delivery.bulkItems) {
                    delivery.bulkItems.forEach((item: BulkItem, index: number) => {
                        const itemId = `${deliveryId}-bulk-${index}`;

                        // Generate material number barcode
                        const materialBarcode = container.querySelector(`#material-barcode-${itemId}`);
                        if (materialBarcode) {
                            try {
                                JsBarcode(materialBarcode, item.materialNumber, {
                                    format: 'CODE128',
                                    width: 1.5,
                                    height: 40,
                                    displayValue: true,
                                    fontSize: 10,
                                    margin: 3,
                                    background: '#ffffff',
                                    lineColor: this.themeColor()
                                });
                            } catch (error) {
                                console.warn('Failed to generate material barcode:', error);
                            }
                        }

                        // Generate material number QR code
                        const materialQr = container.querySelector(`#material-qr-${itemId}`) as HTMLCanvasElement;
                        if (materialQr) {
                            try {
                                QRCode.toCanvas(materialQr, item.materialNumber, {
                                    width: 80,
                                    margin: 1,
                                    color: {
                                        dark: this.themeColor(),
                                        light: '#FFFFFF'
                                    }
                                });
                            } catch (error) {
                                console.warn('Failed to generate material QR code:', error);
                            }
                        }

                        // Generate EVD seal number barcode
                        const evdBarcode = container.querySelector(`#evd-barcode-${itemId}`);
                        if (evdBarcode) {
                            try {
                                JsBarcode(evdBarcode, item.evdSealNumber, {
                                    format: 'CODE128',
                                    width: 1.5,
                                    height: 40,
                                    displayValue: true,
                                    fontSize: 10,
                                    margin: 3,
                                    background: '#ffffff',
                                    lineColor: this.themeColor()
                                });
                            } catch (error) {
                                console.warn('Failed to generate EVD seal barcode:', error);
                            }
                        }

                        // Generate EVD seal number QR code
                        const evdQr = container.querySelector(`#evd-qr-${itemId}`) as HTMLCanvasElement;
                        if (evdQr) {
                            try {
                                QRCode.toCanvas(evdQr, item.evdSealNumber, {
                                    width: 80,
                                    margin: 1,
                                    color: {
                                        dark: this.themeColor(),
                                        light: '#FFFFFF'
                                    }
                                });
                            } catch (error) {
                                console.warn('Failed to generate EVD seal QR code:', error);
                            }
                        }
                    });
                }
            });
        }, 100);
    }

    // =============== CREATE TAB METHODS ===============

    /**
     * Add new container item
     */
    addContainerItem(): void {
        this.createForm.containerItems.push({ materialNumber: '', serialNumber: '' });
    }

    /**
     * Remove container item
     * @param index - Index of item to remove
     */
    removeContainerItem(index: number): void {
        if (this.createForm.containerItems.length > 1) {
            this.createForm.containerItems.splice(index, 1);
        }
    }

    /**
     * Add new bulk item
     */
    addBulkItem(): void {
        this.createForm.bulkItems.push({ materialNumber: '', evdSealNumber: '' });
    }

    /**
     * Remove bulk item
     * @param index - Index of item to remove
     */
    removeBulkItem(index: number): void {
        if (this.createForm.bulkItems.length > 1) {
            this.createForm.bulkItems.splice(index, 1);
        }
    }

    /**
     * Change delivery type
     * @param type - New delivery type
     */
    onDeliveryTypeChange(type: DeliveryType): void {
        this.createForm.deliveryType = type;
        this.clearValidationErrors();
    }

    /**
     * Save new shipment delivery
     */
    saveShipmentDelivery(): void {
        this.clearValidationErrors();

        const request: ShipmentDeliveryRequest = {
            shipmentNumber: this.createForm.shipmentNumber.trim(),
            deliveryNumber: this.createForm.deliveryNumber.trim(),
            deliveryType: this.createForm.deliveryType,
            containerItems: this.createForm.deliveryType === DeliveryType.Container ?
                this.createForm.containerItems.filter(item => item.materialNumber.trim() || item.serialNumber.trim()) : undefined,
            bulkItems: this.createForm.deliveryType === DeliveryType.Bulk ?
                this.createForm.bulkItems.filter(item => item.materialNumber.trim() || item.evdSealNumber.trim()) : undefined
        };

        const errors = this.shipmentService.validateRequest(request);
        if (errors.length > 0) {
            this.validationErrors.set(errors);
            return;
        }

        this.isSaving.set(true);

        this.shipmentService.createShipmentDelivery(request)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSaving.set(false))
            )
            .subscribe({
                next: () => {
                    this.showModal({
                        type: 'success',
                        title: 'Success',
                        message: 'Shipment delivery created successfully!'
                    });
                    this.resetCreateForm();

                    // Switch to view tab and search for the created shipment
                    this.activeTab.set('view');
                    this.searchNumber.set(request.deliveryNumber);
                    setTimeout(() => this.searchShipment(), 500);
                },
                error: (error: any) => {
                    this.showModal({
                        type: 'error',
                        title: 'Create Error',
                        message: error.message || 'Failed to create shipment delivery.'
                    });
                }
            });
    }

    /**
     * Reset create form to initial state
     */
    public resetCreateForm(): void {
        this.createForm = {
            shipmentNumber: '',
            deliveryNumber: '',
            deliveryType: DeliveryType.Container,
            containerItems: [{ materialNumber: '', serialNumber: '' }],
            bulkItems: [{ materialNumber: '', evdSealNumber: '' }]
        };
        this.clearValidationErrors();
    }

    // =============== MODAL METHODS ===============

    /**
     * Show "Data not found" modal
     */
    private showNotFoundModal(): void {
        this.modalState.set({
            isVisible: true,
            type: 'not-found',
            title: 'Data Not Found',
            message: `No shipment or delivery found for "${this.searchNumber()}". Would you like to add this delivery/shipment number?`,
            showApiConfig: false
        });
    }

    /**
     * Show general modal
     * @param config - Modal configuration
     */
    private showModal(config: Partial<ModalState>): void {
        this.modalState.set({
            isVisible: true,
            type: config.type || 'error',
            title: config.title || '',
            message: config.message || '',
            showApiConfig: config.showApiConfig || false
        });
    }

    /**
     * Close modal
     */
    closeModal(): void {
        this.modalState.set({
            isVisible: false,
            type: 'not-found',
            title: '',
            message: ''
        });
    }

    /**
     * Handle "Yes" button click in not-found modal
     * Navigate to create tab with the searched number pre-filled
     */
    onNotFoundYes(): void {
        const searchedNumber = this.searchNumber();

        // Close modal
        this.closeModal();

        // Switch to create tab
        this.activeTab.set('create');

        // Pre-fill the delivery number with the searched term
        setTimeout(() => {
            this.createForm.deliveryNumber = searchedNumber;
        }, 100);
    }

    /**
     * Save API configuration
     */
    saveApiConfig(): void {
        const config: Partial<ApiConfig> = {};

        if (this.apiConfig.baseUrl.trim()) {
            config.baseUrl = this.apiConfig.baseUrl.trim();
        }

        if (this.apiConfig.bearerToken.trim()) {
            config.bearerToken = this.apiConfig.bearerToken.trim();
        }

        this.shipmentService.updateApiConfig(config);

        this.showModal({
            type: 'success',
            title: 'Configuration Saved',
            message: 'API configuration has been saved successfully!'
        });

        setTimeout(() => this.closeModal(), 2000);
    }

    /**
     * Clear validation errors
     */
    private clearValidationErrors(): void {
        this.validationErrors.set([]);
    }

    /**
     * Get delivery type display name
     * @param type - Delivery type
     */
    getDeliveryTypeName(type: DeliveryType): string {
        return type === DeliveryType.Container ? 'Container' : 'Bulk';
    }

    /**
     * Format date for display
     * @param dateString - ISO date string
     */
    formatDate(dateString: string): string {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    }

    /**
     * Generate safe DOM ID from string
     * @param input - Input string
     */
    getSafeId(input: string): string {
        return input.replace(/[^a-zA-Z0-9]/g, '');
    }
}
