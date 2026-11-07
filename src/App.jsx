import React, { useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';

// Components
import LoginView from './components/LoginView.jsx';
import Navbar from './components/Navbar.jsx';
import DashboardView from './components/DashboardView.jsx';
import RawMaterialsView from './components/RawMaterialsView.jsx';
import IntermediatesView from './components/IntermediatesView.jsx';
import FinalProductsView from './components/FinalProductsView.jsx';
import RecipeBookView from './components/RecipeBookView.jsx';
import UnitsSettingsView from './components/UnitsSettingsView.jsx';

// Modals
import EditMaterialModal from './components/EditMaterialModal.jsx';
import EditIntermediateModal from './components/EditIntermediateModal.jsx';
import EditProductModal from './components/EditProductModal.jsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [manager, setManager] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recipeBookSelectedId, setRecipeBookSelectedId] = useState(null);

  // Data states
  const [materials, setMaterials] = useState([]);
  const [intermediates, setIntermediates] = useState([]);
  const [products, setProducts] = useState([]);
  const [unitsData, setUnitsData] = useState({ standardUnits: [], globalConversions: [] });
  const [dataLoading, setDataLoading] = useState(false);

  // Modals
  const [materialModal, setMaterialModal] = useState({ open: false, data: null });
  const [intermediateModal, setIntermediateModal] = useState({ open: false, data: null });
  const [productModal, setProductModal] = useState({ open: false, data: null });

  // Check auth on initial mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.authenticated) {
          setIsAuthenticated(true);
          setManager(res.manager);
        }
      } catch {
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setManager(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch all business data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      const [mats, inters, prods, units] = await Promise.all([
        api.getMaterials(),
        api.getIntermediates(),
        api.getProducts(),
        api.getUnits(),
      ]);
      setMaterials(mats || []);
      setIntermediates(inters || []);
      setProducts(prods || []);
      setUnitsData(units || { standardUnits: [], globalConversions: [] });
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Auth actions
  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.token) {
      setToken(res.token);
      setManager(res.manager);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setToken(null);
    setIsAuthenticated(false);
    setManager(null);
  };

  // Material Modal Handlers
  const handleOpenAddMaterial = (defaultCategory) =>
    setMaterialModal({ open: true, data: defaultCategory ? { category: defaultCategory } : null });
  const handleOpenEditMaterial = (mat) => setMaterialModal({ open: true, data: mat });
  const handleCloseMaterialModal = () => setMaterialModal({ open: false, data: null });
  const handleSaveMaterial = async (formData) => {
    try {
      if (materialModal.data && materialModal.data.id) {
        await api.updateMaterial(materialModal.data.id, formData);
      } else {
        await api.createMaterial(formData);
      }
      handleCloseMaterialModal();
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در ذخیره ماده اولیه');
    }
  };
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('آیا از حذف این ماده اولیه اطمینان دارید؟')) return;
    try {
      await api.deleteMaterial(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در حذف ماده اولیه');
    }
  };

  // Intermediate Modal Handlers
  const handleOpenAddIntermediate = (defaultCategory) =>
    setIntermediateModal({ open: true, data: defaultCategory ? { category: defaultCategory } : null });
  const handleOpenEditIntermediate = (inter) => setIntermediateModal({ open: true, data: inter });
  const handleCloseIntermediateModal = () => setIntermediateModal({ open: false, data: null });
  const handleSaveIntermediate = async (formData) => {
    try {
      if (intermediateModal.data && intermediateModal.data.id) {
        await api.updateIntermediate(intermediateModal.data.id, formData);
      } else {
        await api.createIntermediate(formData);
      }
      handleCloseIntermediateModal();
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در ذخیره کالای واسط');
    }
  };
  const handleDeleteIntermediate = async (id) => {
    if (!window.confirm('آیا از حذف این کالای واسط اطمینان دارید؟')) return;
    try {
      await api.deleteIntermediate(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در حذف کالای واسط');
    }
  };

  // Product Modal Handlers
  const handleOpenAddProduct = (defaultCategory) =>
    setProductModal({ open: true, data: defaultCategory ? { category: defaultCategory } : null });
  const handleOpenEditProduct = (prod) => setProductModal({ open: true, data: prod });
  const handleCloseProductModal = () => setProductModal({ open: false, data: null });
  const handleSaveProduct = async (formData) => {
    try {
      if (productModal.data && productModal.data.id) {
        await api.updateProduct(productModal.data.id, formData);
      } else {
        await api.createProduct(formData);
      }
      handleCloseProductModal();
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در ذخیره محصول منو');
    }
  };
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('آیا از حذف این محصول منو اطمینان دارید؟')) return;
    try {
      await api.deleteProduct(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در حذف محصول');
    }
  };
  const handleUpdateProductMultiplier = async (id, profitMultiplier) => {
    try {
      await api.updateProductMultiplier(id, profitMultiplier);
      await fetchData();
    } catch (err) {
      alert(err.message || 'خطا در تغییر ضریب سود');
    }
  };

  // Navigation Helper
  const handleNavigate = (tab, optionalId) => {
    setActiveTab(tab);
    if (tab === 'recipebook' && optionalId) {
      setRecipeBookSelectedId(optionalId);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium text-slate-300">در حال بارگذاری سامانه رستوران...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        manager={manager}
        onLogout={handleLogout}
        onOpenSettings={() => setActiveTab('units')}
        onOpenBackup={() => setActiveTab('units')}
        counts={{
          materials: materials.length,
          intermediates: intermediates.length,
          products: products.length,
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            intermediates={intermediates}
            materials={materials}
            onNavigate={handleNavigate}
            onOpenProductModal={handleOpenAddProduct}
            onOpenIntermediateModal={handleOpenAddIntermediate}
            onOpenMaterialModal={handleOpenAddMaterial}
          />
        )}

        {activeTab === 'materials' && (
          <RawMaterialsView
            materials={materials}
            onAddMaterial={handleOpenAddMaterial}
            onEditMaterial={handleOpenEditMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            availableCategories={(unitsData.categories || []).filter((c) => !c.type || c.type === 'material')}
          />
        )}

        {activeTab === 'intermediates' && (
          <IntermediatesView
            intermediates={intermediates}
            onAddIntermediate={handleOpenAddIntermediate}
            onEditIntermediate={handleOpenEditIntermediate}
            onDeleteIntermediate={handleDeleteIntermediate}
            availableCategories={(unitsData.categories || []).filter((c) => c.type === 'intermediate')}
          />
        )}

        {activeTab === 'products' && (
          <FinalProductsView
            products={products}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenRecipeBook={(id) => handleNavigate('recipebook', id)}
            onUpdateMultiplier={handleUpdateProductMultiplier}
            availableCategories={(unitsData.categories || []).filter((c) => c.type === 'product')}
          />
        )}

        {activeTab === 'recipebook' && (
          <RecipeBookView
            products={products}
            selectedProductId={recipeBookSelectedId}
            onSelectProduct={setRecipeBookSelectedId}
            onEditProduct={handleOpenEditProduct}
          />
        )}

        {activeTab === 'units' && (
          <UnitsSettingsView
            unitsData={unitsData}
            manager={manager}
            onRefreshData={fetchData}
          />
        )}
      </main>

      {/* Modals */}
      <EditMaterialModal
        isOpen={materialModal.open}
        material={materialModal.data}
        onClose={handleCloseMaterialModal}
        onSave={handleSaveMaterial}
        availableUnits={unitsData.purchaseUnits}
        availableCategories={(unitsData.categories || []).filter((c) => !c.type || c.type === 'material')}
        globalConversions={unitsData.globalConversions || unitsData.conversionChains || []}
      />

      <EditIntermediateModal
        isOpen={intermediateModal.open}
        intermediate={intermediateModal.data}
        onClose={handleCloseIntermediateModal}
        onSave={handleSaveIntermediate}
        rawMaterials={materials}
        allIntermediates={intermediates}
        availableUnits={unitsData.purchaseUnits}
        availableCategories={(unitsData.categories || []).filter((c) => c.type === 'intermediate')}
        globalConversions={unitsData.globalConversions || unitsData.conversionChains || []}
      />

      <EditProductModal
        isOpen={productModal.open}
        product={productModal.data}
        onClose={handleCloseProductModal}
        onSave={handleSaveProduct}
        rawMaterials={materials}
        intermediateGoods={intermediates}
        availableUnits={unitsData.purchaseUnits}
        availableCategories={(unitsData.categories || []).filter((c) => c.type === 'product')}
        globalConversions={unitsData.globalConversions || unitsData.conversionChains || []}
      />

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        سامانه تخصصی قیمت‌گذاری و رسپی‌بوک رستوران • بهای تمام شده، کالای واسط و سود مصوب
      </footer>
    </div>
  );
}
