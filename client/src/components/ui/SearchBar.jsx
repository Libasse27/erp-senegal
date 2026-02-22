import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import { FiSearch, FiX } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';

/**
 * Search input with debounce
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when debounced value changes
 * @param {string} props.placeholder - Input placeholder
 * @param {number} props.delay - Debounce delay in ms (default 300)
 */
const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  delay = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (onChange && debouncedSearchTerm !== value) {
      onChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <InputGroup>
      <InputGroup.Text>
        <FiSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <Button variant="outline-secondary" onClick={handleClear}>
          <FiX />
        </Button>
      )}
    </InputGroup>
  );
};

export default SearchBar;
