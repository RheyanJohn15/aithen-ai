'use client';

import { useState } from 'react';
import { CreditCard, Calendar, Receipt, Download, Plus, Trash2 } from 'lucide-react';
import { Input, Button, Select, Modal } from '@/components/common';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export default function BillingPage() {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const currentPlan = {
    name: 'Professional',
    price: '$99',
    period: 'month',
    features: ['500K API requests/month', '500 GB storage', '100 training hours', 'Priority support'],
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      last4: '8888',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
    },
  ];

  const invoices: Invoice[] = [
    { id: 'INV-001', date: '2024-01-15', amount: '$99.00', status: 'paid' },
    { id: 'INV-002', date: '2023-12-15', amount: '$99.00', status: 'paid' },
    { id: 'INV-003', date: '2023-11-15', amount: '$99.00', status: 'paid' },
    { id: 'INV-004', date: '2024-02-15', amount: '$99.00', status: 'pending' },
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1).padStart(2, '0'),
  }));

  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(new Date().getFullYear() + i),
    label: String(new Date().getFullYear() + i),
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Billing</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your subscription, payment methods, and invoices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Subscription */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Current Plan</h2>
              <Button variant="outline" size="sm">Change Plan</Button>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-[var(--color-aithen-teal)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentPlan.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPlan.price}/{currentPlan.period}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[var(--color-aithen-teal)]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next billing date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">February 15, 2024</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCardModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Card
              </Button>
            </div>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                            Default
                          </span>
                        )}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  {!method.isDefault && (
                    <button className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Invoices</h2>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{invoice.amount}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Billing Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Current Plan</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{currentPlan.price}/{currentPlan.period}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Overage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$0.00</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{currentPlan.price}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Charged monthly</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Need Help?</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Contact our billing team for assistance with your subscription or payment questions.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      {/* Add Card Modal */}
      <Modal
        isOpen={showAddCardModal}
        onClose={() => {
          setShowAddCardModal(false);
          setCardNumber('');
          setCardName('');
          setExpiryMonth('');
          setExpiryYear('');
          setCvv('');
        }}
        title="Add Payment Method"
        size="md"
        footer={
          <div className="flex justify-end space-x-1.5">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCardModal(false);
                setCardNumber('');
                setCardName('');
                setExpiryMonth('');
                setExpiryYear('');
                setCvv('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Payment method added!');
                setShowAddCardModal(false);
                setCardNumber('');
                setCardName('');
                setExpiryMonth('');
                setExpiryYear('');
                setCvv('');
              }}
              disabled={!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv}
            >
              Add Card
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Card Number"
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
            leftIcon={CreditCard}
            required
          />
          <Input
            label="Cardholder Name"
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Expiry Month"
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value)}
              options={monthOptions}
              placeholder="MM"
              required
            />
            <Select
              label="Expiry Year"
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value)}
              options={yearOptions}
              placeholder="YYYY"
              required
            />
          </div>
          <Input
            label="CVV"
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
