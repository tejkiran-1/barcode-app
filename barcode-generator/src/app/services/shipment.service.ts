import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Interface for Container Item
 */
export interface ContainerItem {
    materialNumber: string;
    serialNumber: string;
}

/**
 * Interface for Bulk Item
 */
export interface BulkItem {
    materialNumber: string;
    evdSealNumber: string;
}

/**
 * Enum for Delivery Type
 */
export enum DeliveryType {
    Container = 0,
    Bulk = 1
}

/**
 * Interface for Shipment Delivery Request
 */
export interface ShipmentDeliveryRequest {
    shipmentNumber: string;
    deliveryNumber: string;
    deliveryType: DeliveryType;
    containerItems?: ContainerItem[];
    bulkItems?: BulkItem[];
}

/**
 * Interface for API Configuration
 */
export interface ApiConfig {
    baseUrl: string;
    bearerToken?: string;
}

/**
 * Interface for Error Response
 */
export interface ErrorResponse {
    message: string;
    details?: string;
    errors?: { [key: string]: string[] };
}

/**
 * Interface for Shipment Response
 */
export interface ShipmentResponse {
    shipmentNumber: string;
    deliveries: DeliveryResponse[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Interface for Delivery Response
 */
export interface DeliveryResponse {
    deliveryNumber: string;
    deliveryType: DeliveryType;
    containerItems?: ContainerItem[];
    bulkItems?: BulkItem[];
    createdAt: string;
}

/**
 * Service for managing shipment deliveries
 * Handles all API interactions with the shipment delivery backend
 */
@Injectable({
    providedIn: 'root'
})
export class ShipmentService {
    private defaultConfig: ApiConfig = {
        baseUrl: 'https://barcode-api-ecolab.azurewebsites.net'
    };

    private currentConfig: ApiConfig = { ...this.defaultConfig };

    constructor(private http: HttpClient) {
        // Load saved configuration from localStorage
        this.loadSavedConfig();
    }

    /**
     * Load API configuration from localStorage
     */
    private loadSavedConfig(): void {
        try {
            // Check if we're running in the browser
            if (typeof localStorage !== 'undefined') {
                const savedConfig = localStorage.getItem('shipment_api_config');
                if (savedConfig) {
                    this.currentConfig = { ...this.defaultConfig, ...JSON.parse(savedConfig) };
                }
            }
        } catch (error) {
            console.warn('Failed to load saved API configuration:', error);
        }
    }

    /**
     * Save API configuration to localStorage
     */
    private savConfig(): void {
        try {
            // Check if we're running in the browser
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('shipment_api_config', JSON.stringify(this.currentConfig));
            }
        } catch (error) {
            console.warn('Failed to save API configuration:', error);
        }
    }

    /**
     * Update API configuration
     * @param config - New API configuration
     */
    updateApiConfig(config: Partial<ApiConfig>): void {
        this.currentConfig = { ...this.currentConfig, ...config };
        this.savConfig();
    }

    /**
     * Get current API configuration
     */
    getApiConfig(): ApiConfig {
        return { ...this.currentConfig };
    }

    /**
     * Get HTTP headers with authorization if token is available
     */
    private getHeaders(): HttpHeaders {
        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json'
        };

        if (this.currentConfig.bearerToken) {
            headers['Authorization'] = `Bearer ${this.currentConfig.bearerToken}`;
        }

        return new HttpHeaders(headers);
    }

    /**
     * Handle HTTP errors
     * @param error - HTTP error response
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An unexpected error occurred';

        if (error.error) {
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error.message) {
                errorMessage = error.error.message;
            } else if (error.error.details) {
                errorMessage = error.error.details;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        return throwError(() => ({
            status: error.status,
            message: errorMessage,
            details: error.error?.details,
            errors: error.error?.errors
        }));
    }

    /**
     * Create a new shipment delivery
     * @param request - Shipment delivery data
     */
    createShipmentDelivery(request: ShipmentDeliveryRequest): Observable<any> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery`;

        return this.http.post(url, request, { headers: this.getHeaders() })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    /**
     * Get shipment by shipment number
     * @param shipmentNumber - Shipment number to search
     */
    getShipmentByNumber(shipmentNumber: string): Observable<ShipmentResponse> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery/shipment/${encodeURIComponent(shipmentNumber)}`;

        return this.http.get<ShipmentResponse>(url, { headers: this.getHeaders() })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    /**
     * Get shipment by delivery number
     * @param deliveryNumber - Delivery number to search
     */
    getShipmentByDeliveryNumber(deliveryNumber: string): Observable<ShipmentResponse> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery/delivery/${encodeURIComponent(deliveryNumber)}`;

        return this.http.get<ShipmentResponse>(url, { headers: this.getHeaders() })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    /**
     * Get all shipments
     */
    getAllShipments(): Observable<ShipmentResponse[]> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery`;

        return this.http.get<ShipmentResponse[]>(url, { headers: this.getHeaders() })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    /**
     * Search for shipment or delivery by number
     * First tries to find by delivery number, then by shipment number
     * @param searchNumber - Number to search (can be shipment or delivery)
     */
    searchByNumber(searchNumber: string): Observable<ShipmentResponse> {
        // First try searching by delivery number
        return this.getShipmentByDeliveryNumber(searchNumber)
            .pipe(
                catchError((error) => {
                    // If delivery search fails with 404, try shipment search
                    if (error.status === 404) {
                        return this.getShipmentByNumber(searchNumber);
                    }
                    // Re-throw other errors
                    return throwError(() => error);
                })
            );
    }

    /**
     * Update shipment by shipment number
     * @param shipmentNumber - Current shipment number to update
     * @param updateData - Updated shipment data
     */
    updateShipment(shipmentNumber: string, updateData: {
        shipmentNumber: string;
        deliveries: {
            deliveryNumber: string;
            deliveryType: number;
            containerItems?: ContainerItem[];
            bulkItems?: BulkItem[];
        }[];
    }): Observable<ShipmentResponse> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery/shipment/${encodeURIComponent(shipmentNumber)}`;
        
        console.log('🔗 Update API URL:', url);
        console.log('📤 Update request data:', updateData);
        console.log('🔑 API Headers:', this.getHeaders());

        return this.http.put<ShipmentResponse>(url, updateData, { headers: this.getHeaders() })
            .pipe(
                catchError((error) => {
                    console.error('🚨 Service updateShipment error:', error);
                    return this.handleError(error);
                })
            );
    }

    /**
     * Validate shipment delivery request
     * @param request - Request to validate
     */
    validateRequest(request: ShipmentDeliveryRequest): string[] {
        const errors: string[] = [];

        if (!request.shipmentNumber?.trim()) {
            errors.push('Shipment number is required');
        }

        if (!request.deliveryNumber?.trim()) {
            errors.push('Delivery number is required');
        }

        if (request.deliveryType !== DeliveryType.Container && request.deliveryType !== DeliveryType.Bulk) {
            errors.push('Delivery type must be Container (0) or Bulk (1)');
        }

        if (request.deliveryType === DeliveryType.Container) {
            if (!request.containerItems || request.containerItems.length === 0) {
                errors.push('At least one container item is required for Container delivery type');
            } else {
                request.containerItems.forEach((item, index) => {
                    if (!item.materialNumber?.trim()) {
                        errors.push(`Container item ${index + 1}: Material number is required`);
                    }
                    if (!item.serialNumber?.trim()) {
                        errors.push(`Container item ${index + 1}: Serial number is required`);
                    }
                });
            }
        }

        if (request.deliveryType === DeliveryType.Bulk) {
            if (!request.bulkItems || request.bulkItems.length === 0) {
                errors.push('At least one bulk item is required for Bulk delivery type');
            } else {
                request.bulkItems.forEach((item, index) => {
                    if (!item.materialNumber?.trim()) {
                        errors.push(`Bulk item ${index + 1}: Material number is required`);
                    }
                    if (!item.evdSealNumber?.trim()) {
                        errors.push(`Bulk item ${index + 1}: EVD seal number is required`);
                    }
                });
            }
        }

        return errors;
    }

    /**
     * Reset API configuration to default
     */
    resetApiConfig(): void {
        this.currentConfig = { ...this.defaultConfig };
        // Check if we're running in the browser
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('shipment_api_config');
        }
    }

    /**
     * Test API connectivity
     */
    testConnection(): Observable<boolean> {
        const url = `${this.currentConfig.baseUrl}/api/shipmentdelivery`;

        return this.http.get(url, { headers: this.getHeaders() })
            .pipe(
                map(() => true),
                catchError(() => throwError(() => false))
            );
    }
}
