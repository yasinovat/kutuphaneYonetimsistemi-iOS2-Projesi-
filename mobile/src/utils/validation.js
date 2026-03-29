// Email validasyonu
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Şifre validasyonu
export function validatePassword(password) {
  // Minimum 6 karakterli, en az 1 büyük harf, 1 sayı
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
}

// Ad validasyonu
export function validateFullName(name) {
  return name && name.trim().length >= 3;
}

// Login form validasyonu
export function validateLoginForm(email, password) {
  const errors = {};

  if (!email) {
    errors.email = 'E-posta adresi zorunludur';
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi girin';
  }

  if (!password) {
    errors.password = 'Şifre zorunludur';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Register form validasyonu
export function validateRegisterForm(fullName, email, password, passwordConfirm) {
  const errors = {};

  if (!fullName) {
    errors.fullName = 'Ad Soyad zorunludur';
  } else if (!validateFullName(fullName)) {
    errors.fullName = 'Ad Soyad en az 3 karakter olmalı';
  }

  if (!email) {
    errors.email = 'E-posta adresi zorunludur';
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi girin';
  }

  if (!password) {
    errors.password = 'Şifre zorunludur';
  } else if (!validatePassword(password)) {
    errors.password = 'Şifre en az 6 karakter, 1 büyük harf ve 1 sayı içermelidir';
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = 'Şifre tekrarı zorunludur';
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Şifreler eşleşmiyor';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
