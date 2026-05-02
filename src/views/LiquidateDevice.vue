<template>
  <Layout>
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight text-red-600">Thanh lý thiết bị</h2>
        <p class="text-slate-500 text-sm">Hồ sơ thanh lý tài sản IT đã hư hỏng hoặc hết giá trị sử dụng.</p>
      </div>

      <div v-if="user?.role !== 'Administrator'" class="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
         <p class="text-red-700 font-bold">Chỉ có Quản trị viên mới được thực hiện thao tác này.</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <!-- 1. Bộ lọc Khoa/Phòng -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn Khoa / Phòng</label>
          <select v-model="selectedDepartment" @change="handleDeptChange" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-blue-500">
            <option value="" disabled>-- Chọn Khoa / Phòng --</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn thiết bị cần thanh lý</label>
          <select 
            v-model="form.equipment_id" 
            required 
            :disabled="!selectedDepartment || loadingEquipment"
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-red-500"
          >
            <option value="" disabled>{{ loadingEquipment ? 'Đang tải...' : '-- Chọn thiết bị --' }}</option>
            <option v-for="e in filteredEquipment" :key="e.id" :value="e.id">
              {{ e.code }} - {{ e.name }} ({{ e.type }})
            </option>
          </select>
          <p v-if="selectedDepartment && filteredEquipment.length === 0 && !loadingEquipment" class="text-[10px] text-red-500 font-medium italic mt-1">
            Không tìm thấy thiết bị nào đang sử dụng tại khoa này.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ngày thanh lý</label>
            <input 
              v-model="form.date"
              type="date"
              required
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mã hồ sơ / Chứng từ</label>
            <input 
              v-model="form.document_ref"
              required
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="VD: QD-123/2023"
            />
          </div>
        </div>

        <!-- 2. Lý do thanh lý -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Lý do thanh lý</label>
          <textarea 
            v-model="form.reason"
            required
            rows="3"
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-500 transition-all text-sm"
            placeholder="Cụ thể tình trạng hư hỏng hoặc lý do hết niên hạn..."
          ></textarea>
        </div>

        <!-- 3. Tải lên tài liệu thực tế -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hồ sơ / Biên bản / Hình ảnh đính kèm</label>
          
          <div v-if="!selectedFile" @click="$refs.fileInput.click()" class="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer bg-slate-50/50 group">
             <Upload size="32" class="mb-2 group-hover:scale-110 transition-transform" />
             <span class="text-xs font-bold uppercase tracking-widest">Chọn file tài liệu (PDF, Ảnh)</span>
             <p class="text-[10px] text-slate-400 mt-2 italic">Dung lượng tối đa 5MB</p>
          </div>
          
          <div v-else class="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
                <FileText size="20" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-700 truncate max-w-[200px]">{{ selectedFile.name }}</p>
                <p class="text-[10px] text-slate-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
              </div>
            </div>
            <button @click="removeFile" type="button" class="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <X size="20" />
            </button>
          </div>
          
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept="image/*,application/pdf"
            @change="handleFileChange"
          />
        </div>

        <div class="p-4 bg-red-50/50 rounded-xl border border-red-100 flex items-start gap-3">
          <input 
            type="checkbox" 
            id="reported" 
            v-model="form.reported"
            class="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
          />
          <label for="reported" class="text-xs font-bold text-red-800 leading-relaxed cursor-pointer">
            Tôi xác nhận đã báo cáo lãnh đạo có thẩm quyền về việc thanh lý thiết bị này và chịu trách nhiệm về thông tin cung cấp.
          </label>
        </div>

        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="loading || !form.reported"
            class="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Đang thực hiện...' : 'Xác nhận thanh lý tài sản' }}
          </button>
        </div>
      </form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import { Upload, FileText, X } from 'lucide-vue-next';

const router = useRouter();
const departments = ref<any[]>([]);
const filteredEquipment = ref<any[]>([]);
const selectedDepartment = ref('');
const loading = ref(false);
const loadingEquipment = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<any>(null);
const user = JSON.parse(localStorage.getItem('user') || '{}');

const form = reactive({
  equipment_id: '',
  date: new Date().toISOString().split('T')[0],
  document_ref: '',
  reason: '',
  reported: false
});

const fetchDepartments = async () => {
  try {
    const res = await fetch('/api/admin/departments', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    departments.value = await res.json();
  } catch (err) {
    console.error("Fetch depts error:", err);
  }
};

const handleDeptChange = async () => {
  if (!selectedDepartment.value) return;
  
  loadingEquipment.value = true;
  form.equipment_id = '';
  try {
    const res = await fetch(`/api/equipment/department/${selectedDepartment.value}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    filteredEquipment.value = await res.json();
  } catch (err) {
    console.error("Fetch equipment error:", err);
  } finally {
    loadingEquipment.value = false;
  }
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const handleSubmit = async () => {
  if (!form.equipment_id) return alert('Vui lòng chọn thiết bị');
  if (!form.reason.trim()) return alert('Vui lòng nhập lý do thanh lý');

  loading.value = true;
  
  const formData = new FormData();
  formData.append('equipment_id', form.equipment_id);
  formData.append('liquidation_date', form.date);
  formData.append('document_ref', form.document_ref);
  formData.append('reason', form.reason);
  formData.append('reported_to_manager', 'true');
  if (selectedFile.value) {
    formData.append('attachment', selectedFile.value);
  }

  try {
    const res = await fetch('/api/transactions/liquidate', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (res.ok) {
      alert('Thanh lý thiết bị thành công!');
      router.push('/dashboard');
    } else {
      const err = await res.json();
      alert('Lỗi: ' + (err.message || err.error));
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi gửi yêu cầu.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDepartments();
});
</script>
