INSERT INTO books (title, author, genre, isbn, published_year, total_copies, available_copies)
VALUES
  ('1984', 'George Orwell', 'Distopya', '9780451524935', 1949, 4, 4),
  ('Suc ve Ceza', 'Fyodor Dostoyevski', 'Klasik', '9780140449136', 1866, 3, 3),
  ('Seker Portakali', 'Jose Mauro de Vasconcelos', 'Roman', '9789750738609', 1968, 5, 5),
  ('Kurk Mantolu Madonna', 'Sabahattin Ali', 'Roman', '9789753638029', 1943, 4, 4),
  ('Dune', 'Frank Herbert', 'Bilim Kurgu', '9780441172719', 1965, 2, 2),
  ('Hayvan Ciftligi', 'George Orwell', 'Politik Roman', '9789750719387', 1945, 6, 6),
  ('The Pragmatic Programmer', 'Andrew Hunt', 'Yazilim', '9780135957059', 1999, 3, 3),
  ('Clean Code', 'Robert C. Martin', 'Yazilim', '9780132350884', 2008, 2, 2),
  ('Kucuk Prens', 'Antoine de Saint-Exupery', 'Cocuk', '9789750732232', 1943, 5, 5),
  ('Sefiller', 'Victor Hugo', 'Klasik', '9789750719301', 1862, 3, 3)
ON CONFLICT (isbn) DO NOTHING;
