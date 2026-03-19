import React, { useState, useEffect, useCallback } from 'react';
import { 
  Input, Button, Space, Select, Tooltip, 
  Badge, Tag, Dropdown, Menu, Typography 
} from 'antd';
import { 
  SearchOutlined, FilterOutlined, CloseOutlined,
  ReloadOutlined, SettingOutlined, SaveOutlined,
  DownOutlined 
} from '@ant-design/icons';
import './SearchBar.css';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SearchBar = ({
  onSearch,
  onReset,
  placeholder = "Buscar...",
  defaultValue = "",
  loading = false,
  filters = [],
  onFilterChange,
  advancedFilters = [],
  onAdvancedSearch,
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  size = "middle",
  allowClear = true,
  showFilterButton = true,
  showAdvancedButton = false,
  showSavedSearches = false,
  style = {},
  className = "",
}) => {
  const [searchText, setSearchText] = useState(defaultValue);
  const [activeFilters, setActiveFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Efecto para inicializar con valor por defecto
  useEffect(() => {
    setSearchText(defaultValue);
  }, [defaultValue]);

  // Manejar búsqueda con debounce
  const handleSearch = useCallback((value) => {
    setSearchText(value);
    
    // Si hay filtros activos, combinarlos con la búsqueda
    const searchParams = {
      search: value,
      ...activeFilters,
    };
    
    onSearch(searchParams);
    
    // Agregar a historial si no está vacío
    if (value && !searchHistory.includes(value)) {
      setSearchHistory(prev => [value, ...prev.slice(0, 4)]);
    }
  }, [onSearch, activeFilters, searchHistory]);

  // Manejar cambio de filtros
  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value,
    };
    
    // Remover filtro si el valor es nulo o vacío
    if (value === null || value === '' || value === undefined) {
      delete newFilters[filterKey];
    }
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
    
    // Disparar búsqueda con nuevos filtros
    handleSearch(searchText);
  };

  // Resetear todos los filtros
  const handleReset = () => {
    setSearchText("");
    setActiveFilters({});
    setShowAdvanced(false);
    
    if (onReset) {
      onReset();
    } else {
      onSearch({ search: "" });
    }
  };

  // Manejar búsqueda avanzada
  const handleAdvancedSearch = () => {
    if (onAdvancedSearch) {
      onAdvancedSearch({
        search: searchText,
        ...activeFilters,
        ...advancedFilters.reduce((acc, filter) => ({
          ...acc,
          [filter.key]: filter.value
        }), {})
      });
    }
  };

  // Menú de búsquedas guardadas
  const savedSearchesMenu = (
    <Menu>
      {savedSearches.length > 0 ? (
        savedSearches.map((search, index) => (
          <Menu.Item key={index} onClick={() => onLoadSearch && onLoadSearch(search)}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text ellipsis style={{ maxWidth: 200 }}>
                {search.name || `Búsqueda ${index + 1}`}
              </Text>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveSearch && onSaveSearch(search);
                  }}
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSearch && onDeleteSearch(search.id);
                  }}
                />
              </Space>
            </Space>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item disabled>
          <Text type="secondary">No hay búsquedas guardadas</Text>
        </Menu.Item>
      )}
    </Menu>
  );

  // Contador de filtros activos
  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key] !== undefined && activeFilters[key] !== ''
  ).length;

  return (
    <div className={`search-bar ${className}`} style={style}>
      <Space orientation="vertical" style={{ width: '100%' }}>
        {/* Barra de búsqueda principal */}
        <Space style={{ width: '100%' }}>
          <Search
            placeholder={placeholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={() => handleSearch(searchText)}
            loading={loading}
            allowClear={allowClear}
            size={size}
            style={{ flex: 1 }}
            enterButton={
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                loading={loading}
              >
                Buscar
              </Button>
            }
          />

          {/* Botón de filtros */}
          {showFilterButton && filters.length > 0 && (
            <Dropdown
              overlay={
                <Menu style={{ padding: '8px', minWidth: 200 }}>
                  {filters.map((filter) => (
                    <Menu.Item key={filter.key}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Text strong>{filter.label}</Text>
                        {filter.type === 'select' ? (
                          <Select
                            placeholder={`Seleccionar ${filter.label.toLowerCase()}`}
                            value={activeFilters[filter.key]}
                            onChange={(value) => handleFilterChange(filter.key, value)}
                            style={{ width: '100%' }}
                            allowClear
                          >
                            {filter.options.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        ) : filter.type === 'date' ? (
                          <div>Date Picker Component</div>
                        ) : (
                          <Input
                            placeholder={`Buscar por ${filter.label.toLowerCase()}`}
                            value={activeFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            onPressEnter={() => handleSearch(searchText)}
                          />
                        )}
                      </Space>
                    </Menu.Item>
                  ))}
                </Menu>
              }
              trigger={['click']}
              placement="bottomRight"
            >
              <Button icon={<FilterOutlined />} size={size}>
                Filtros
                {activeFilterCount > 0 && (
                  <Badge 
                    count={activeFilterCount} 
                    size="small" 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </Button>
            </Dropdown>
          )}

          {/* Botón de búsqueda avanzada */}
          {showAdvancedButton && (
            <Button
              type={showAdvanced ? "primary" : "default"}
              icon={<SettingOutlined />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              size={size}
            >
              Avanzado
            </Button>
          )}

          {/* Botón de búsquedas guardadas */}
          {showSavedSearches && (
            <Dropdown overlay={savedSearchesMenu} trigger={['click']}>
              <Button icon={<SaveOutlined />} size={size}>
                Guardadas <DownOutlined />
              </Button>
            </Dropdown>
          )}

          {/* Botón de reset */}
          {(searchText || activeFilterCount > 0) && (
            <Tooltip title="Limpiar búsqueda">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size={size}
                danger
              >
                Limpiar
              </Button>
            </Tooltip>
          )}
        </Space>

        {/* Filtros activos */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            <Space wrap>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Filtros activos:
              </Text>
              {Object.entries(activeFilters).map(([key, value]) => {
                if (!value) return null;
                
                const filter = filters.find(f => f.key === key);
                const filterLabel = filter?.label || key;
                const option = filter?.options?.find(opt => opt.value === value);
                const displayValue = option?.label || value;

                return (
                  <Tag
                    key={key}
                    closable
                    onClose={() => handleFilterChange(key, null)}
                    style={{ fontSize: '12px' }}
                  >
                    {filterLabel}: {displayValue}
                  </Tag>
                );
              })}
              <Button
                type="link"
                size="small"
                onClick={() => {
                  const newFilters = {};
                  Object.keys(activeFilters).forEach(key => {
                    newFilters[key] = '';
                  });
                  setActiveFilters(newFilters);
                  handleSearch(searchText);
                }}
                style={{ fontSize: '12px', padding: 0 }}
              >
                Limpiar todos
              </Button>
            </Space>
          </div>
        )}

        {/* Historial de búsqueda */}
        {searchHistory.length > 0 && searchText === "" && (
          <div className="search-history">
            <Space wrap>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Historial:
              </Text>
              {searchHistory.map((term, index) => (
                <Tag
                  key={index}
                  onClick={() => {
                    setSearchText(term);
                    handleSearch(term);
                  }}
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                >
                  {term}
                </Tag>
              ))}
              <Button
                type="link"
                size="small"
                onClick={() => setSearchHistory([])}
                style={{ fontSize: '12px', padding: 0 }}
              >
                Limpiar historial
              </Button>
            </Space>
          </div>
        )}

        {/* Panel de búsqueda avanzada */}
        {showAdvanced && advancedFilters.length > 0 && (
          <div className="advanced-search-panel">
            <Space orientation="vertical" style={{ width: '100%', padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
              <Text strong>Búsqueda Avanzada</Text>
              <Space wrap style={{ width: '100%' }}>
                {advancedFilters.map((filter) => (
                  <div key={filter.key} style={{ minWidth: 200 }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                      {filter.label}
                    </Text>
                    {filter.type === 'select' ? (
                      <Select
                        placeholder={filter.placeholder}
                        style={{ width: '100%' }}
                        options={filter.options}
                        onChange={(value) => {
                          filter.onChange && filter.onChange(value);
                        }}
                      />
                    ) : filter.type === 'range' ? (
                      <Space.Compact style={{ width: '100%' }}>
                        <Input placeholder="Mínimo" />
                        <Input placeholder="Máximo" />
                      </Space.Compact>
                    ) : (
                      <Input
                        placeholder={filter.placeholder}
                        onChange={(e) => {
                          filter.onChange && filter.onChange(e.target.value);
                        }}
                      />
                    )}
                  </div>
                ))}
              </Space>
              <Button type="primary" onClick={handleAdvancedSearch}>
                Aplicar filtros avanzados
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </div>
  );
};

export default SearchBar;
