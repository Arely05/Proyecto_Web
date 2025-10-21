import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { CartItem } from '../../models/cart-item';
import { CartService } from '../../services/cart';
import { NgxPayPalModule, IPayPalConfig } from 'ngx-paypal';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe, NavbarComponent, NgxPayPalModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  items: CartItem[] = [];
  paid = false;
  ivaRate = 0.16; // Tasa de IVA del 16%

  public payPalConfig?: IPayPalConfig;

  constructor(private cart: CartService) {
    this.cart.items$?.subscribe?.(items => this.items = items) ?? (this.items = this.cart.items ?? []);
  }

  ngOnInit(): void {
    this.initConfig();
  }

  subtotal(): number {
    return this.cart.getTotal(); 
  }

  iva(): number {
    return this.subtotal() * this.ivaRate;
  }

  total(): number {
    return this.subtotal() + this.iva();
  }

  private initConfig(): void {
    if (this.items.length === 0) {
      return;
    }

    const subtotalAmount = this.subtotal().toFixed(2);
    const ivaAmount = this.iva().toFixed(2);
    const totalAmount = this.total().toFixed(2);

    this.payPalConfig = {
      currency: 'MXN',
      clientId: 'AVUA2Mwi3IdZd2-VEvNWGeMqxsb2pnb5GnP2qrniPpWXeDPBsX22cX5_TBkOo_vF2haxCZW6mW7lVxig',
      createOrderOnClient: (data) => <any>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'MXN',
            value: totalAmount, 
            breakdown: {
              item_total: { 
                currency_code: 'MXN',
                value: subtotalAmount
              },
              tax_total: {
                currency_code: 'MXN',
                value: ivaAmount
              }
            }
          },
          items: this.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: 'MXN',
              value: parseFloat(item.product.price as any).toFixed(2),
            },
          }))
        }]
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      onClientAuthorization: (data) => {
        console.log('Pago completado:', data);
        this.paid = true;
        this.generateReceiptXML(data);
        this.cart.clear();
      },
      onCancel: (data, actions) => {
        console.log('Pago cancelado:', data, actions);
      },
      onError: err => {
        console.error('Error en el pago:', err);
      }
    };
  }

  private generateReceiptXML(data: any) {
    const date = new Date().toISOString();

    const subtotal = this.subtotal().toFixed(2);
    const iva = this.iva().toFixed(2);
    const total = this.total().toFixed(2);

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<recibo>
  <encabezado>
    <tienda>Zeus Vet</tienda>
    <fecha>${date}</fecha>
    <idTransaccion>${data.id}</idTransaccion>
    <estado>${data.status}</estado>
  </encabezado>
  <cliente>
    <nombre>${data.payer?.name?.given_name || 'No especificado'}</nombre>
    <correo>${data.payer?.email_address || 'No especificado'}</correo>
  </cliente>
  <detalleProductos>
    ${this.items.map(item => `
    <producto>
      <nombre>${item.product.name}</nombre>
      <cantidad>${item.quantity}</cantidad>
      <precioUnitario>${parseFloat(item.product.price as any).toFixed(2)}</precioUnitario>
      <subtotalProducto>${(item.quantity * parseFloat(item.product.price as any)).toFixed(2)}</subtotalProducto>
    </producto>
    `).join('')}
  </detalleProductos>
  <resumenFinanciero>
    <moneda>MXN</moneda>
    <subtotal>${subtotal}</subtotal>
    <iva>${iva}</iva>
    <total>${total}</total>
  </resumenFinanciero>
</recibo>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recibo_${data.id}.xml`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('Recibo generado:', `Recibo_${data.id}.xml`);
  }
}
