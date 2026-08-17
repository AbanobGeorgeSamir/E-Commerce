import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Upload,
  User,
  X
} from
  'lucide-react';
import api from '../api/axios';
import InputField from '../components/ui/InputField';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import {
  getApiErrorMessage,
  getEntityId,
  getImageFileError,
  normalizeItem,
  normalizeValidationErrors,
  readFileAsDataUrl,
  toCurrency
} from
  '../utils/api';

const getCheckoutItems = (cart) =>
  cart.map((item) => ({
    productId: getEntityId(item),
    quantity: Number(item.quantity) || 1
  }));

const buildCheckoutPayload = ({ address, receiptImage, cart }) => {
  const checkoutItems = getCheckoutItems(cart);
  const shippingAddress = {
    name: address.fullName,
    fullName: address.fullName,
    email: address.email,
    phone: address.phone,
    street: address.street,
    city: address.city,
    zip: address.zip || '',
    postalCode: address.zip || '',
    address: [address.street, address.city, address.zip].filter(Boolean).join(', ')
  };

  return {
    paymentMethod: 'Cash on Delivery',
    shippingAddress,
    items: checkoutItems,
    receiptImage
  };
};

const submitCheckout = async (payload) => api.post('/checkout', payload);

export default function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (!user) return;

    setAddress((current) => ({
      ...current,
      fullName: current.fullName || user.name || '',
      email: current.email || user.email || ''
    }));
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50">
        <div className="max-w-xl w-full bg-white border border-slate-100 rounded-[2.5rem] p-10 text-center shadow-xl shadow-slate-200/40">
          <h1 className="text-4xl font-black text-slate-900">Sign in to checkout</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to proceed with checkout.</p>
          <button onClick={() => navigate('/login')} className="mt-8 w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const shippingFee = subtotal > 500 ? 0 : 15;
  const tax = subtotal * 0.05;
  const orderTotal = subtotal + shippingFee + tax;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageError = getImageFileError(file);
    if (imageError) {
      toast.error(imageError);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!cart.length) {
      toast.error('Your cart is empty');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a receipt or ID image');
      return;
    }

    if (!address.fullName.trim() || !address.email.trim() || !address.phone.trim() || !address.city.trim() || !address.street.trim()) {
      toast.error('Please complete the shipping information before checking out.');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const receiptImage = await readFileAsDataUrl(imageFile);
      if (!receiptImage) {
        throw new Error('Failed to process the selected image. Please choose another file.');
      }

      const payload = buildCheckoutPayload({ address, receiptImage, cart });
      const response = await submitCheckout(payload);

      const orderPayload = normalizeItem(response.data);
      const orderId =
        orderPayload?.order_id ||
        orderPayload?.orderId ||
        getEntityId(orderPayload) ||
        response.data?.order_id ||
        response.data?.orderId;
      const total =
        orderPayload?.total ||
        orderPayload?.amount ||
        response.data?.data?.total ||
        orderTotal;

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/order-success', {
        replace: true,
        state: { orderId, total }
      });
    } catch (error) {
      const validationErrors = normalizeValidationErrors(error.response?.data);

      if (error.response?.status === 422 && Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        const firstMessage = Object.values(validationErrors).flat()[0];
        toast.error(firstMessage || 'Please review the form and try again.');
      } else if (error.response?.status === 401) {
        toast.error('Please log in again before checking out.');
        navigate('/login', { replace: true });
      } else {
        console.error(error);
        toast.error(getApiErrorMessage(error, 'Checkout failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="bg-slate-100 p-8 rounded-full">
          <ShoppingBag size={64} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Your bag is empty</h2>
        <p className="text-slate-500 max-w-sm">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link
          to="/"
          className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-all">

          Start Shopping
        </Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-black transition-colors mb-2">

              <ArrowLeft size={16} /> Return to Cart
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>
          </div>
          <div className="flex items-center gap-4 bg-green-50 px-5 py-3 rounded-2xl text-green-700 border border-green-100">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">Secure SSL Encrypted</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-[1fr,420px] gap-12 items-start">
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-black text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold">Shipping Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  icon={<User size={18} />}
                  value={address.fullName}
                  onChange={(event) => setAddress({ ...address, fullName: event.target.value })}
                  error={errors.name?.[0]}
                  required />

                <InputField
                  label="Email Address"
                  placeholder="john@example.com"
                  type="email"
                  icon={<Mail size={18} />}
                  value={address.email}
                  onChange={(event) => setAddress({ ...address, email: event.target.value })}
                  error={errors.email?.[0]}
                  required />

                <InputField
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 234 567 890"
                  icon={<Phone size={18} />}
                  value={address.phone}
                  onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                  error={errors.phone?.[0]}
                  required />

                <InputField
                  label="City"
                  type="text"
                  placeholder="New York"
                  icon={<MapPin size={18} />}
                  value={address.city}
                  onChange={(event) => setAddress({ ...address, city: event.target.value })}
                  error={errors.city?.[0]}
                  required />

                <div className="md:col-span-2">
                  <InputField
                    label="Street Address"
                    type="text"
                    placeholder="123 Luxury Ave, Suite 100"
                    value={address.street}
                    onChange={(event) => setAddress({ ...address, street: event.target.value })}
                    error={errors.street?.[0]}
                    required />

                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-black text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">2</div>
                <h2 className="text-2xl font-bold">Verification</h2>
              </div>
              <p className="text-slate-500 mb-8 ml-11">Please upload a photo of your receipt or valid ID.</p>

              <div
                className={`relative border-2 border-dashed rounded-3xl p-10 transition-all ${previewUrl ?
                    'border-green-200 bg-green-50/30' :
                    'border-slate-200 hover:border-black bg-slate-50/50'}`
                }>

                {!previewUrl ?
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>

                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <Upload className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700">Click to upload image</p>
                    <p className="text-sm text-slate-400 mt-1">AVIF, JPG, PNG or WEBP · 2 MB maximum</p>
                  </div> :

                  <div className="relative w-full flex flex-col items-center">
                    <img src={previewUrl} alt="Preview" className="max-h-64 rounded-2xl object-cover shadow-lg" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-xl hover:bg-red-600 transition-transform active:scale-90">

                      <X size={20} />
                    </button>
                    <p className="mt-4 text-sm font-medium text-green-600 flex items-center gap-2">
                      <FileText size={16} /> {imageFile?.name}
                    </p>
                  </div>
                }

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/avif,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange} />

              </div>

              {errors.image && <p className="text-red-500 text-sm mt-3 ml-2 font-medium">{errors.image[0]}</p>}
              {errors.items && <p className="text-red-500 text-sm mt-3 ml-2 font-medium">{errors.items[0]}</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl h-fit sticky top-12">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              Summary{' '}
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{cart.length}</span>
            </h3>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 mb-6">
              {cart.map((item) =>
                <div key={item.id} className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-black transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-700">{toCurrency(item.price * item.quantity)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-50">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-800">{toCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-bold' : 'text-slate-800'}>
                  {shippingFee === 0 ? 'Free' : toCurrency(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (5%)</span>
                <span className="text-slate-800">{toCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-black pt-4 border-t-2 border-black/5">
                <span>Total</span>
                <span className="text-black">{toCurrency(orderTotal)}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-4 border border-blue-100">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-tighter">Payment Method</p>
                  <p className="text-sm font-semibold text-blue-700">Cash on Delivery</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-black text-white py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-bold text-lg hover:bg-slate-900 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg hover:shadow-black/20">

                {loading ?
                  <Loader2 className="animate-spin" /> :

                  <ShoppingBag size={22} className="group-hover:translate-y-[-2px] transition-transform" />
                }
                {loading ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>);

}
