import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BooksContext } from '../contexts/BooksContext';
import { ThemeContext } from '../contexts/ThemeContext';

function getCoverHue(title = '') {
  const seed = title.split('').reduce((value, character) => value + character.charCodeAt(0), 0);
  return seed % 360;
}

function getInitials(title = '') {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'KB';
}

function buildGoogleBooksQuery(book = {}) {
  const parts = [];

  if (book.title) {
    parts.push(`intitle:${encodeURIComponent(book.title)}`);
  }

  if (book.author) {
    parts.push(`inauthor:${encodeURIComponent(book.author)}`);
  }

  return parts.join('+');
}

function buildGoogleBooksIsbnQuery(isbn) {
  const normalizedIsbn = String(isbn || '').replace(/[^0-9Xx]/g, '');
  return normalizedIsbn ? `isbn:${encodeURIComponent(normalizedIsbn)}` : '';
}

function normalizeCoverUrl(url) {
  if (!url) return null;
  const secureUrl = url.replace('http://', 'https://');

  if (secureUrl.includes('books.google.com') || secureUrl.includes('googleusercontent.com')) {
    return secureUrl
      .replace(/zoom=\d/, 'zoom=2')
      .replace(/&edge=curl/g, '')
      .replace(/&source=gbs_api/g, '');
  }

  return secureUrl;
}

async function fetchCoverForQuery(query) {
  if (!query) return null;
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    if (!response.ok) return null;
    const data = await response.json();
    const item = data.items?.[0];
    const thumbnail = item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail;
    return normalizeCoverUrl(thumbnail);
  } catch (e) {
    return null;
  }
}

async function fetchOpenLibraryCover(book = {}) {
  try {
    const query = [book.title, book.author].filter(Boolean).map(value => encodeURIComponent(value)).join('+');
    if (!query) return null;

    const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    const coverId = data.docs?.[0]?.cover_i;
    return coverId ? normalizeCoverUrl(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`) : null;
  } catch (e) {
    return null;
  }
}

async function checkImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchBookCoverUrl(book) {
  if (!book) return null;

  const titleAuthorQuery = buildGoogleBooksQuery({ title: book.title, author: book.author });
  if (titleAuthorQuery) {
    const byTitle = await fetchCoverForQuery(titleAuthorQuery);
    if (byTitle) return byTitle;
  }

  try {
    const simple = [book.title, book.author].filter(Boolean).map(s => encodeURIComponent(s)).join('+');
    if (simple) {
      const bySimple = await fetchCoverForQuery(simple);
      if (bySimple) return bySimple;
    }
  } catch (e) {
    // ignore
  }

  const byOpenLibrary = await fetchOpenLibraryCover(book);
  if (byOpenLibrary) return byOpenLibrary;

  if (book.isbn) {
    const isbnQuery = buildGoogleBooksIsbnQuery(book.isbn);
    const byIsbn = await fetchCoverForQuery(isbnQuery);
    if (byIsbn) return byIsbn;

    try {
      const normalizedIsbn = String(book.isbn).replace(/[^0-9Xx]/g, '');
      if (normalizedIsbn) {
        const olUrl = `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-L.jpg`;
        const ok = await checkImageUrl(olUrl);
        if (ok) return normalizeCoverUrl(olUrl);
      }
    } catch (e) {}
  }

  return null;
}

export default function BookCard({ book, onPress, compact = false }) {
  const { getCoverForBook, setCoverForBook } = useContext(BooksContext);
  const { colors } = useContext(ThemeContext);
  const cacheKey = book?.id ?? book?.isbn ?? `${book?.title || ''}-${book?.author || ''}`;
  const initialCoverUrl = normalizeCoverUrl(book?.coverUrl || book?.cover_url || getCoverForBook(cacheKey));
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [failedCoverUrl, setFailedCoverUrl] = useState(null);
  const initials = useMemo(() => getInitials(book.title), [book.title]);
  const stockCount = Number(book.available_copies || 0);
  const stockLabel = stockCount > 0 ? `Stokta ${stockCount}` : 'Tükendi';
  const coverHue = getCoverHue(book.title);

  useEffect(() => {
    let isMounted = true;

    const cached = getCoverForBook(cacheKey);
    if (cached) {
      setCoverUrl(cached);
      return () => {};
    }

    if (book?.coverUrl || book?.cover_url) {
      const nextCoverUrl = normalizeCoverUrl(book.coverUrl || book.cover_url);
      setCoverUrl(nextCoverUrl);
      setCoverForBook(cacheKey, nextCoverUrl);
      return () => {};
    }

    const loadCover = async () => {
      try {
        const nextCoverUrl = await fetchBookCoverUrl(book);

        if (isMounted) {
          setCoverUrl(nextCoverUrl);
          if (nextCoverUrl) {
            setCoverForBook(cacheKey, nextCoverUrl);
          }
        }
      } catch (error) {
        if (isMounted) {
          setCoverUrl(null);
        }
      }
    };

    loadCover();

    return () => {
      isMounted = false;
    };
  }, [book.author, book.coverUrl, book.cover_url, book.isbn, book.title, cacheKey, getCoverForBook, setCoverForBook]);

  const handleCoverError = async () => {
    const currentUrl = coverUrl;
    setFailedCoverUrl(currentUrl);

    try {
      const fallbackUrl = await fetchBookCoverUrl({
        ...book,
        isbn: ''
      });

      if (fallbackUrl && fallbackUrl !== currentUrl) {
        setCoverUrl(fallbackUrl);
        setCoverForBook(cacheKey, fallbackUrl);
        return;
      }
    } catch (error) {
      // Harfli kapak fallback olarak kullanılır.
    }

    setCoverUrl(null);
  };

  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.compactCard,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.primary }
      ]}
      onPress={onPress}
    >
      <View style={[styles.cover, { backgroundColor: `hsl(${coverHue}, 45%, 28%)` }]}>
        {coverUrl && coverUrl !== failedCoverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" onError={handleCoverError} />
        ) : (
          <Text style={[styles.coverText, { color: colors.card }]}>{initials}</Text>
        )}
        <View style={[styles.stockPill, stockCount > 0 ? styles.stockPillInStock : styles.stockPillOutOfStock]}>
          <Text style={styles.stockPillText}>{stockCount > 0 ? 'Aktif' : 'Pasif'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text>
        <Text style={[styles.metaSecondary, { color: colors.textSecondary }]} numberOfLines={1}>{book.genre || 'Genel'}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.stockText}>{stockLabel}</Text>
          <Text style={styles.isbnText}>{book.isbn}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d6e2dc',
    shadowColor: '#0b3d2e',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  compactCard: {
    marginBottom: 12
  },
  cover: {
    width: 72,
    height: 108,
    borderRadius: 16,
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%'
  },
  coverText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1
  },
  stockPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  stockPillInStock: {
    backgroundColor: 'rgba(57, 181, 74, 0.18)'
  },
  stockPillOutOfStock: {
    backgroundColor: 'rgba(176, 49, 40, 0.18)'
  },
  stockPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#133c31'
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: '#33554b',
    fontWeight: '600'
  },
  metaSecondary: {
    marginTop: 2,
    fontSize: 13,
    color: '#667d75'
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  stockText: {
    flex: 1,
    color: '#0b3d2e',
    fontSize: 12,
    fontWeight: '800'
  },
  isbnText: {
    color: '#6d7f79',
    fontSize: 11,
    fontWeight: '700'
  }
});
