<template>
  <Layout>
    <div class="max-w-4xl mx-auto">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">{{ isEdit ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới' }}</h2>
          <p class="text-slate-500 text-sm">Quản lý thông tin chi tiết và cấu hình thiết bị.</p>
        </div>
        <router-link to="/statistics" class="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1">
          <ArrowLeft size="14" /> Quay lại danh sách
        </router-link>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <!-- Thông tin cơ bản -->
        <div class="space-y-6">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Thông tin định danh</h3>
          
          <!-- Thông tin cấp phát hiện tại (Chỉ hiển thị khi đang sửa và thiết bị đang sử dụng) -->
          <div v-if="isEdit && form.status === 'Đang sử dụng'" class="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col gap-4 mb-6">
             <div class="flex items-center gap-2 text-blue-700">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-xs font-bold uppercase tracking-wider">Thông tin cấp phát hiện tại</span>
             </div>
             
             <div v-if="issueInfo" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Khoa phòng đang sử dụng</p>
                  <p class="text-sm font-bold text-slate-700">{{ issueInfo.department_name || 'Đang cập nhật...' }}</p>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Người thực hiện cấp</p>
                  <p class="text-sm font-bold text-slate-700">{{ issueInfo.issuer_name || 'Hệ thống' }}</p>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Ngày giờ cấp</p>
                  <p class="text-sm font-bold text-slate-700">{{ formatDate(issueInfo.issue_date) }}</p>
                </div>
             </div>
             <div v-else class="text-xs text-slate-400 italic">
                Thiết bị đang sử dụng nhưng chưa có lịch sử cấp phát chi tiết.
             </div>
          </div>
          <div v-else-if="isEdit && form.status === 'Trong kho'" class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex items-center gap-3">
             <div class="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                <Info size="18" />
             </div>
             <span class="text-sm font-medium text-slate-500">Thiết bị hiện đang trong kho, chưa được cấp phát.</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại thiết bị</label>
              <select v-model="selectedType" required :disabled="isEdit" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed mb-2">
                <option v-for="t in predefinedTypes" :key="t" :value="t">{{ t }}</option>
                <option value="Khác">Khác (Thêm loại mới...)</option>
              </select>
              
              <input 
                v-if="selectedType === 'Khác'"
                v-model="customType"
                placeholder="Nhập loại thiết bị mới (VD: Máy đếm tiền...)"
                required
                class="w-full px-4 py-2 border border-blue-200 bg-blue-50/30 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên thiết bị</label>
              <input v-model="form.name" @blur="checkDuplicateName" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
              <p v-if="nameError" class="text-[10px] text-red-500 font-bold mt-1">{{ nameError }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã thiết bị (Tự động phát sinh)</label>
              <div class="relative group">
                <input 
                  v-model="form.code" 
                  readonly
                  disabled
                  placeholder="Mã sẽ tự động hiển thị..."
                  class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-500 font-mono font-bold cursor-not-allowed" 
                />
                <div v-if="loadingCode" class="absolute right-3 top-1/2 -translate-y-1/2">
                   <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 italic">Mã được sinh tự động theo quy tắc loại thiết bị (Tối đa 8 ký tự).</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái hiện tại</label>
              <select v-model="form.status" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer font-medium">
                <option value="Trong kho">Trong kho</option>
                <option value="Đang sử dụng">Đang sử dụng</option>
                <option value="Đang sửa">Đang sửa</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Cấu hình động dựa trên loại thiết bị -->
        <div class="space-y-6 pt-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Cấu hình chi tiết</h3>
          
          <!-- Trường hợp: Máy tính (Desktop/Laptop) -->
          <div v-if="isComputer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPU</label>
              <input v-model="form.specs.cpu" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-1 focus:ring-blue-500" placeholder="VD: Core i5-12400" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mainboard</label>
              <input v-model="form.mainboard" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-1 focus:ring-blue-500" placeholder="VD: ASUS B660M-A" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RAM</label>
              <input v-model="form.specs.ram" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-1 focus:ring-blue-500" placeholder="VD: 16GB DDR4" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ổ cứng (HDD/SSD)</label>
              <input v-model="form.specs.hdd" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-1 focus:ring-blue-500" placeholder="VD: SSD 512GB" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên máy tính (Hostname)</label>
              <input v-model="form.specs.hostname" @input="onHostnameInput" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm font-mono focus:ring-1 focus:ring-blue-500" placeholder="VD: PK-NHI-01" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ IP</label>
              <input v-model="form.specs.ip" @blur="checkDuplicateIP" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm font-mono focus:ring-1 focus:ring-blue-500" placeholder="VD: 192.168.1.50" />
              <p v-if="ipError" class="text-[10px] text-red-500 font-bold mt-1">{{ ipError }}</p>
            </div>
          </div>

          <!-- Trường hợp: Thiết bị ngoại vi hoặc loại khác -->
          <div v-else class="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên máy tính đang gắn vào (Nếu có)</label>
            <input v-model="form.specs.attached_to" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm" placeholder="VD: Máy tính bác sĩ A (Hostname: PK-NOI-02)" />
            <p class="text-[10px] text-slate-400">Để trống nếu là thiết bị độc lập.</p>
          </div>
        </div>

        <!-- Thông tin mua sắm (Không bắt buộc) -->
        <div class="space-y-6 pt-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Thông tin nhập kho</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày nhập (Không bắt buộc)</label>
              <input v-model="form.entry_date" type="date" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Công ty cung cấp (Không bắt buộc)</label>
              <input v-model="form.supplier" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none" placeholder="VD: Công ty TNHH IT Khương" />
            </div>
          </div>
        </div>

        <div class="pt-8 border-t border-slate-100 flex gap-4">
          <button 
            type="submit" 
            :disabled="loading || !!nameError || !!ipError"
            class="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {{ loading ? 'Đang thực hiện...' : (isEdit ? 'Lưu thay đổi' : 'Tạo thiết bị') }}
          </button>
          <button 
            type="button"
            @click="$router.push('/statistics')"
            class="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Layout from '../../components/Layout.vue';
import { ArrowLeft, Info } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingCode = ref(false);
const isEdit = computed(() => !!route.params.id);
const issueInfo = ref<any>(null);

const nameError = ref('');
const ipError = ref('');
const manuallyEditedHostname = ref(false);

const predefinedTypes = [
  'Desktop', 
  'Laptop', 
  'Máy in', 
  'Màn hình', 
  'Máy scan', 
  'Máy quét vân tay', 
  'Máy quét barcode'
];
const selectedType = ref('Desktop');
const customType = ref('');

const form = reactive({
  code: '',
  name: '',
  type: '',
  status: 'Trong kho',
  department_id: null as number | null,
  entry_date: '',
  supplier: '',
  mainboard: '',
  specs: {} as any
});

const isComputer = computed(() => {
  const current = selectedType.value === 'Khác' ? customType.value : selectedType.value;
  return ['Desktop', 'Laptop'].includes(current);
});

const getGeneratedCode = async (type: string) => {
  if (isEdit.value || !type) return;
  loadingCode.value = true;
  try {
    const res = await fetch(`/api/equipment/generate-code?type=${encodeURIComponent(type)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      form.code = data.code;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingCode.value = false;
  }
};

watch(selectedType, (newType) => {
  if (newType !== 'Khác') {
    getGeneratedCode(newType);
  } else {
    getGeneratedCode(customType.value || 'Khác');
  }
}, { immediate: !isEdit.value });

watch(customType, (newVal) => {
  if (selectedType.value === 'Khác' && newVal) {
    getGeneratedCode(newVal);
  }
});

watch(() => form.name, (newName) => {
  if (isComputer.value && !manuallyEditedHostname.value && !isEdit.value) {
    form.specs.hostname = newName;
  }
});

const onHostnameInput = () => {
  manuallyEditedHostname.value = true;
};

const checkDuplicateName = async () => {
  if (!form.name || isEdit.value) {
    nameError.value = '';
    return;
  }
  try {
    const res = await fetch(`/api/equipment/check-name?name=${encodeURIComponent(form.name)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.exists) {
      nameError.value = 'Tên thiết bị này đã tồn tại trong hệ thống!';
    } else {
      nameError.value = '';
    }
  } catch (err) {
    console.error(err);
  }
};

const checkDuplicateIP = async () => {
  if (!form.specs.ip || isEdit.value) {
    ipError.value = '';
    return;
  }
  try {
    const res = await fetch(`/api/equipment/check-ip?ip=${encodeURIComponent(form.specs.ip)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.exists) {
      ipError.value = 'Địa chỉ IP này đã được sử dụng!';
    } else {
      ipError.value = '';
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchEquipmentDetails = async () => {
  if (!isEdit.value) return;
  try {
    const res = await fetch(`/api/equipment/${route.params.id}`, {
       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      const item = await res.json();
      form.code = item.code;
      form.name = item.name;
      form.status = item.status;
      form.department_id = item.department_id;
      form.entry_date = item.entry_date || '';
      form.supplier = item.supplier || '';
      form.mainboard = item.mainboard || '';
      
      // Lưu thông tin cấp phát
      if (item.issue_date) {
        issueInfo.value = {
          department_name: item.department_name,
          issuer_name: item.issuer_name,
          issue_date: item.issue_date
        };
      } else {
        issueInfo.value = null;
      }
      
      // Handle type logic
      if (predefinedTypes.includes(item.type)) {
        selectedType.value = item.type;
        customType.value = '';
      } else {
        selectedType.value = 'Khác';
        customType.value = item.type;
      }

      try {
        const parsed = typeof item.specs === 'string' ? JSON.parse(item.specs) : (item.specs || {});
        // Map legacy keys to new ones if necessary
        form.specs = {
          cpu: parsed.cpu || '',
          ram: parsed.ram || '',
          hdd: parsed.hdd || parsed.storage || '',
          hostname: parsed.hostname || parsed.computer_name || '',
          ip: parsed.ip || parsed.ip_address || '',
          attached_to: parsed.attached_to || '',
          note: parsed.note || ''
        };
      } catch (e) { form.specs = { cpu: '', ram: '', hdd: '', hostname: '', ip: '', attached_to: '', note: '' }; }
    }
  } catch (err) { console.error(err); }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Chưa rõ';
  const d = new Date(dateString);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} - ${date}`;
};

const handleSubmit = async () => {
  loading.value = true;
  form.type = selectedType.value === 'Khác' ? customType.value : selectedType.value;
  
  // Ensure mainboard is also in specs for tooltip consistency
  if (isComputer.value) {
    form.specs.mainboard = form.mainboard;
  }

  const url = isEdit.value ? `/api/equipment/${route.params.id}` : '/api/equipment';
  const method = isEdit.value ? 'PUT' : 'POST';
  
  // Clone form to avoid modifying reactive state before submit
  const payload = JSON.parse(JSON.stringify(form));
  // Backend expects specs as a JSON string in equipmentController, but we send it as an object
  // and the controller does JSON.stringify(specs).
  // To avoid confusion, let's keep it as an object in the payload.
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      router.push('/statistics');
    } else {
      const err = await res.json();
      alert('Lỗi: ' + (err.message || err.error));
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEquipmentDetails);
</script>
