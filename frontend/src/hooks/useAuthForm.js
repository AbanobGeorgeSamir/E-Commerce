import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { toast } from 'react-hot-toast';
import { authenticate } from '../api/axios';
import { isAdminUser, normalizeValidationErrors } from '../utils/api';

export const useAuthForm = (type = 'login') => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload =
        type === 'register' ?
          {
            ...formData,
            fullName: formData.name,
            username: formData.email,
            passwordConfirmation: formData.password_confirmation,
            confirmPassword: formData.password_confirmation
          } :
          {
            ...formData,
            username: formData.email
          };

      const { user: authenticatedUser, token: rawToken } = await authenticate(type, payload);
      const currentUser = await login(authenticatedUser, rawToken || null);

      if (!currentUser) {
        throw new Error('Authentication succeeded but no user session was returned');
      }

      toast.success(type === 'login' ? 'Welcome back!' : 'Account created successfully!');

      const fallbackPath = isAdminUser(currentUser) ? '/admin' : '/';
      const redirectTo = location.state?.from?.pathname || fallbackPath;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const validationErrors = normalizeValidationErrors(err.response?.data);

      if (err.response?.status === 422 && Object.keys(validationErrors).length) {
        Object.values(validationErrors).flat().forEach((message) => toast.error(message));
      } else if (err.response?.status === 401) {
        toast.error(err.response?.data?.message || 'Invalid email or password');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, loading };
};
