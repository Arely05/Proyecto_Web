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

  public payPalConfig?: IPayPalConfig;

  constructor(private cart: CartService) {
    this.cart.items$?.subscribe?.(items => this.items = items) ?? (this.items = this.cart.items ?? []);
  }

  ngOnInit(): void {
    this.initConfig();
  }

  total() {
    return this.cart.getTotal();
  }

  private initConfig(): void {
    const totalAmount = this.total().toFixed(2);

    if (this.items.length === 0) {
      return;
    }

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
                value: totalAmount
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
        this.generateReceiptXML(data); //aqui mandamos llamar la creacion del recibo xml, ya que se complete el pago
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

  //preparar datos para el xml
  private generateReceiptXML(data: any) {
    const date = new Date().toISOString();
    const total = this.total().toFixed(2);

    //estructura
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<recibo>
  <tienda>Zeus Vet</tienda>
  <transaccion>
    <id>${data.id}</id>
    <estado>${data.status}</estado>
    <fecha>${date}</fecha>
    <moneda>MXN</moneda>
    <total>${total}</total>
  </transaccion>
  <cliente>
    <nombre>${data.payer?.name?.given_name || 'No especificado'}</nombre>
    <correo>${data.payer?.email_address || 'No especificado'}</correo>
  </cliente>
  <productos>
    ${this.items.map(item => `
    <producto>
      <nombre>${item.product.name}</nombre>
      <cantidad>${item.quantity}</cantidad>
      <precioUnitario>${item.product.price}</precioUnitario>
      <subtotal>${(item.quantity * parseFloat(item.product.price as any)).toFixed(2)}</subtotal>
    </producto>
    `).join('')}
  </productos>
</recibo>`;

    //tipo de archivo que estamos utilizando (xml)
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recibo_${data.id}.xml`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('Recibo XML generado:', `Recibo_${data.id}.xml`);
  }
}