<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Thống kê & Tra cứu</h2>
          <p class="text-slate-500">Tìm kiếm và lọc danh sách thiết bị toàn hệ thống.</p>
        </div>
        <router-link 
          v-if="user.role === 'Administrator' || user.role === 'User'"
          to="/admin/equipment/new" 
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus size="16" /> Thêm thiết bị
        </router-link>
      </div>

      <!-- Filters -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Khoa phòng</label>
          <select v-model="filters.department_id" @change="handleFilterChange" class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50/50 cursor-pointer font-medium">
            <option value="">Tất cả khoa phòng</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại thiết bị</label>
          <select v-model="filters.type" @change="handleFilterChange" class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50/50 cursor-pointer font-medium">
            <option value="">Tất cả loại</option>
            <option v-for="t in equipmentTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</label>
          <select v-model="filters.status" @change="handleFilterChange" class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50/50 cursor-pointer font-medium">
            <option value="">Mọi trạng thái</option>
            <option value="Đã cấp">Đã cấp (Sử dụng + Sửa)</option>
            <option value="Đang sử dụng">Đang sử dụng</option>
            <option value="Đang sửa">Đang sửa</option>
            <option value="Đã thanh lý">Đã thanh lý</option>
            <option value="Trong kho">Trong kho</option>
          </select>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Tổng số: {{ totalItems }} thiết bị</p>
          <div class="relative w-64">
             <input 
              v-model="filters.search"
              type="text" 
              placeholder="Tìm theo mã hoặc tên..." 
              @input="handleSearch"
              class="w-full text-[11px] py-1.5 pl-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
             >
             <Search class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size="14" />
          </div>
        </div>
        <div class="flex-1 overflow-x-auto" ref="tableContainer">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th class="px-6 py-4 border-b border-slate-100">Code</th>
                <th class="px-6 py-4 border-b border-slate-100">Tên thiết bị</th>
                <th class="px-6 py-4 border-b border-slate-100">Vị trí hiện tại</th>
                <th class="px-6 py-4 border-b border-slate-100">Ngày cấp</th>
                <th class="px-6 py-4 border-b border-slate-100">Status</th>
                <th class="px-6 py-4 border-b border-slate-100">Thông số kĩ thuật</th>
                <th v-if="user.role === 'Administrator' || user.role === 'User'" class="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in equipment" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4 text-xs font-mono font-bold text-blue-600">{{ item.code }}</td>
                <td class="px-6 py-4">
                  <p class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-400 uppercase font-bold">{{ item.type }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                    {{ item.current_department || 'Chưa bàn giao' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs font-bold text-slate-500 italic">
                  {{ item.first_issue_date ? formatDate(item.first_issue_date) : '-' }}
                </td>
                <td class="px-6 py-4">
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    :class="{
                      'bg-green-100 text-green-700': item.status === 'Đang sử dụng',
                      'bg-amber-100 text-amber-700': item.status === 'Đang sửa',
                      'bg-slate-100 text-slate-400': item.status === 'Đã thanh lý'
                    }"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4 relative group/tooltip">
                   <div v-if="hasSpecs(item.specs)" class="flex items-center gap-1 cursor-help">
                      <span class="text-[11px] font-medium text-blue-600 border-b border-blue-200 border-dashed hover:text-blue-700 transition-colors">
                        Xem cấu hình
                      </span>
                      <Info size="12" class="text-blue-400" />
                      
                      <!-- Enhanced Tooltip with Delay -->
                      <div class="invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-[100] transition-all duration-300 delay-500 pointer-events-none">
                        <div class="space-y-2">
                           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Chi tiết kĩ thuật</p>
                           <ul class="space-y-1.5">
                              <li v-for="(val, key) in parseSpecs(item.specs)" :key="key" class="flex justify-between items-start gap-4">
                                 <span class="text-[10px] font-bold text-slate-500 uppercase">{{ key }}:</span>
                                 <span class="text-xs font-medium text-right">{{ val }}</span>
                              </li>
                           </ul>
                        </div>
                        <!-- Tooltip Arrow (Top) -->
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
                      </div>
                   </div>
                   <div v-else class="text-[10px] text-slate-300 italic">-</div>
                </td>
                <td v-if="user.role === 'Administrator' || user.role === 'User'" class="px-6 py-4 text-right">
                   <router-link v-if="item.status !== 'Đã thanh lý'" :to="`/admin/equipment/edit/${item.id}`" class="text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit3 size="16" />
                   </router-link>
                   <button 
                    v-else
                    @click="viewLiquidation(item.id)"
                    class="text-slate-400 hover:text-red-500 transition-colors"
                    title="Xem hồ sơ thanh lý"
                   >
                     <Eye size="16" />
                   </button>
                </td>
              </tr>
              <tr v-if="equipment.length === 0">
                <td colspan="6" class="px-6 py-20 text-center text-slate-400 italic">
                   Không tìm thấy thiết bị nào phù hợp.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p class="text-[10px] text-slate-500 font-bold uppercase">Trang {{ currentPage }} / {{ totalPages }}</p>
          <div class="flex items-center gap-2">
            <button 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size="16" />
            </button>
            <div class="flex items-center gap-1">
              <button 
                v-for="p in totalPages" 
                :key="p"
                @click="changePage(p)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all"
                :class="p === currentPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100'"
              >
                {{ p }}
              </button>
            </div>
            <button 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size="16" />
            </button>
          </div>
        </div>
      </div>
      <!-- Export & Import Buttons -->
      <div class="flex items-center justify-center gap-4 pt-4 pb-8">
        <input 
          type="file" 
          ref="fileInput" 
          hidden 
          accept=".xlsx, .xls" 
          @change="handleImport"
        />
        <button 
          v-if="user.role === 'Administrator'"
          @click="triggerImport" 
          :disabled="importing"
          class="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm group disabled:opacity-50"
        >
          <div class="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
            <Upload size="16" />
          </div>
          {{ importing ? 'Đang xử lý...' : 'Nhập liệu từ Excel' }}
        </button>

        <button 
          @click="exportReport('summary')" 
          class="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all shadow-sm group"
        >
          <div class="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
            <Download size="16" />
          </div>
          Xuất báo cáo tổng
        </button>
        <button 
          @click="exportReport('detailed')" 
          class="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm group"
        >
          <div class="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Download size="16" />
          </div>
          Xuất báo cáo chi tiết
        </button>
      </div>
    </div>

    <!-- Liquidation Detail Modal -->
    <div v-if="showLiquidationModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <FileText size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest">Hồ sơ thanh lý</h3>
              <p class="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em]">{{ selectedLiquidation?.equipment_code }}</p>
            </div>
          </div>
          <button @click="showLiquidationModal = false" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size="20" />
          </button>
        </div>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày thanh lý</p>
              <p class="text-sm font-bold text-slate-700">{{ formatDate(selectedLiquidation?.liquidation_date) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người thực hiện</p>
              <p class="text-sm font-bold text-slate-700">{{ selectedLiquidation?.liquidator_name }}</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số chứng từ / Mã hồ sơ</p>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-600">
              {{ selectedLiquidation?.document_ref || 'Không có mã chứng từ' }}
            </div>
          </div>

          <div class="space-y-1.5">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do thanh lý</p>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed italic">
              "{{ selectedLiquidation?.reason || 'Không rõ lý do' }}"
            </div>
          </div>

          <div v-if="selectedLiquidation?.attachment_path" class="pt-2">
            <a 
              :href="selectedLiquidation.attachment_path" 
              target="_blank"
              class="w-full py-3 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <Eye size="16" />
              Xem tài liệu đính kèm
            </a>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="showLiquidationModal = false" class="px-6 py-2 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Layout from '../components/Layout.vue';
import { Search, Plus, Edit3, Info, Eye, X, FileText, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-vue-next';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const equipment = ref<any[]>([]);
const departments = ref<any[]>([]);
const equipmentTypes = ref<string[]>([]);
const totalItems = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const tableContainer = ref<HTMLElement | null>(null);
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const filters = reactive({
  department_id: '',
  type: '',
  status: '',
  search: ''
});

const showLiquidationModal = ref(false);
const selectedLiquidation = ref<any>(null);

const exportReport = async (type: 'summary' | 'detailed') => {
  try {
    const res = await fetch(`/api/reports/${type}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!res.ok) throw new Error('Không thể tải báo cáo');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'summary' ? `Bao-cao-tong-hop-${new Date().toISOString().split('T')[0]}.xlsx` : `Bao-cao-chi-tiet-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err: any) {
    alert('Lỗi khi xuất báo cáo: ' + err.message);
  }
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  importing.value = true;
  try {
    const res = await fetch('/api/equipment/import', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });

    const result = await res.json();
    if (res.ok) {
      alert(`Nhập liệu thành công!\n- Tạo mới: ${result.success}\n- Lỗi: ${result.failed}`);
      fetchData(); // Refresh list
    } else {
      throw new Error(result.message || result.error || 'Lỗi không xác định');
    }
  } catch (err: any) {
    alert('Lỗi khi nhập liệu: ' + err.message);
  } finally {
    importing.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
};

let searchTimeout: any = null;
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 400);
};

const handleFilterChange = () => {
  currentPage.value = 1;
  fetchData();
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchData();
  
  if (tableContainer.value) {
    tableContainer.value.scrollIntoView({ behavior: 'smooth' });
  }
};

const viewLiquidation = async (equipmentId: number) => {
  try {
    const res = await fetch(`/api/transactions/liquidation/${equipmentId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      selectedLiquidation.value = await res.json();
      showLiquidationModal.value = true;
    } else {
      alert('Không tìm thấy thông tin thanh lý cho thiết bị này.');
    }
  } catch (err) {
    console.error(err);
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Chưa rõ';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const hasSpecs = (specsJson: string) => {
  if (!specsJson || specsJson === 'null' || specsJson === '') return false;
  try {
    const obj = JSON.parse(specsJson);
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  } catch (e) { 
    console.error("Specs check error:", e);
    return false; 
  }
};

const parseSpecs = (specsJson: string) => {
  try {
    if (!specsJson) return {};
    const obj = typeof specsJson === 'string' ? JSON.parse(specsJson) : specsJson;
    if (!obj || typeof obj !== 'object') return {};

    const result: Record<string, string> = {};
    const keyMap: Record<string, string> = {
      cpu: 'CPU',
      ram: 'RAM',
      hdd: 'Ổ cứng',
      storage: 'Ổ cứng',
      mainboard: 'Mainboard',
      ip: 'Địa chỉ IP',
      ip_address: 'Địa chỉ IP',
      hostname: 'Tên máy',
      computer_name: 'Tên máy',
      attached_to: 'Gắn vào',
      note: 'Ghi chú'
    };
    
    for (const key in obj) {
      const val = obj[key];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        const label = keyMap[key] || key;
        result[label] = String(val);
      }
    }
    return result;
  } catch (e) { 
    console.error("Specs parse error:", e);
    return { 'Lỗi': 'Định dạng cấu hình không hợp lệ' }; 
  }
};

const fetchData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  
  // Xây dựng query params
  const params = new URLSearchParams();
  if (filters.department_id) params.append('department_id', filters.department_id);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  params.append('page', String(currentPage.value));
  params.append('limit', '30');
  
  const [eqRes, deptRes, typesRes] = await Promise.all([
    fetch(`/api/equipment?${params.toString()}`, { headers }),
    fetch('/api/defaults/departments', { headers }),
    fetch('/api/equipment/types', { headers })
  ]);
  
  const eqData = await eqRes.json();
  equipment.value = eqData.data;
  totalItems.value = eqData.total;
  totalPages.value = eqData.totalPages;
  
  departments.value = await deptRes.json();
  equipmentTypes.value = await typesRes.json();
};

onMounted(fetchData);
</script>
