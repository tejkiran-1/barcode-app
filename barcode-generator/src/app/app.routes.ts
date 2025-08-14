import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./barcode-generator/barcode-generator.component').then(m => m.BarcodeGeneratorComponent),
        title: 'Ecolab Barcode Generator'
    },
    {
        path: 'shipment-manager',
        loadComponent: () => import('./components/shipment-manager/shipment-manager.component').then(m => m.ShipmentManagerComponent),
        title: 'Shipment Manager - Ecolab'
    },
    {
        path: '**',
        redirectTo: ''
    }
];
