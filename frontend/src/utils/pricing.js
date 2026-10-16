const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateOrderTotals = (rawSubtotal) => {
  const subtotal = roundCurrency(rawSubtotal);
  const shippingFee = subtotal >= 500 ? 0 : 15;
  const tax = roundCurrency(subtotal * 0.05);

  return {
    subtotal,
    shippingFee,
    tax,
    total: roundCurrency(subtotal + shippingFee + tax)
  };
};
