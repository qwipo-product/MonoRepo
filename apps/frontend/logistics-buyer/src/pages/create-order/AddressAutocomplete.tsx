// Port of <app-address-autocomplete> (chunk MZXBUYWH). Spec 02 §2.3.
// Stream semantics reproduced: input → debounceTime(300) → distinctUntilChanged(text+provider) → switchMap(autocomplete).
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { geocodeService, type GeocodeProvider, type GeocodeSuggestion } from '../../api/services/geocode.service';
import './AddressAutocomplete.css';

interface Props {
  placeholder?: string;
  label?: string;
  required?: boolean;
  provider?: GeocodeProvider;
  showProviderToggle?: boolean;
  onAddressSelected: (s: GeocodeSuggestion) => void;
}

interface Query { text: string; provider: GeocodeProvider }

export default function AddressAutocomplete({
  placeholder = 'Start typing an address...',
  label = 'Address',
  required = false,
  provider: providerInput,
  showProviderToggle = true,
  onAddressSelected,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedProvider, setSelectedProvider] = useState<GeocodeProvider>(providerInput || 'google');
  const provider = providerInput || selectedProvider;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const lastQueryRef = useRef<Query | null>(null); // distinctUntilChanged memory
  const requestSeqRef = useRef(0); // switchMap: only the latest inner request may emit

  const emit = (q: Query) => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const last = lastQueryRef.current;
      if (last && last.text === q.text && last.provider === q.provider) return;
      lastQueryRef.current = q;
      const seq = ++requestSeqRef.current;
      setIsLoading(true);
      geocodeService.autocomplete(q.text, q.provider).then((r) => {
        if (seq !== requestSeqRef.current) return;
        setSuggestions(r);
        setShowDropdown(r.length > 0);
        setIsLoading(false);
        setActiveIndex(-1);
      });
    }, 300);
  };

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  // a click anywhere outside the component closes the dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const onInput = (text: string) => {
    setInputValue(text);
    if (text.trim().length >= 3) {
      emit({ text, provider });
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoading(false);
    }
  };

  const selectProvider = (p: GeocodeProvider) => {
    setSelectedProvider(p);
    setSuggestions([]);
    setShowDropdown(false);
    if (inputValue.trim().length >= 3) emit({ text: inputValue, provider: p });
  };

  const select = (s: GeocodeSuggestion) => {
    setInputValue(s.formatted);
    onAddressSelected(s);
    setShowDropdown(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    const n = suggestions.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, n - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        select(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {label && (
        <div className="label-row">
          <label className="field-label">
            {label}
            {required && <span className="required-indicator"> *</span>}
          </label>
          {showProviderToggle && !providerInput && (
            <div className="provider-toggle">
              <button type="button" className={`provider-btn${provider === 'google' ? ' active' : ''}`} onClick={() => selectProvider('google')}>
                Google
              </button>
              <button type="button" className={`provider-btn${provider === 'geoapify' ? ' active' : ''}`} onClick={() => selectProvider('geoapify')}>
                Geo
              </button>
            </div>
          )}
        </div>
      )}
      <div className="input-container">
        <input
          type="text"
          className="field-input"
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {isLoading && <span className="loader" />}
      </div>
      {showDropdown && (
        <ul className="suggestions-dropdown">
          {suggestions.map((s, i) => (
            <li
              key={`${s.formatted}-${i}`}
              className={`suggestion-item${i === activeIndex ? ' active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
            >
              <i className="fas fa-map-marker-alt suggestion-icon" />
              <span className="suggestion-text">{s.formatted}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
