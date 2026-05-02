<template>
  <Layout>
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight">Thiết bị sửa chữa</h2>
        <p class="text-slate-500 text-sm">Quản lý và chuyển trạng thái thiết bị sang 'Đang sửa'.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <!-- 1. Khoa phòng hiện tại -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Khoa phòng hiện tại</label>
          <select 
            v-model="form.department_id" 
            @change="handleDepartmentChange"
            required 
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer"
          >
            <option value="">-- Chọn khoa phòng --</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <!-- 2. Chọn thiết bị -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn thiết bị</label>
          <select 
            v-model="form.equipment_id" 
            :disabled="!form.department_id || loadingEquipment"
            required 
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
          >
            <option value="">{{ loadingEquipment ? 'Đang tải thiết bị...' : '-- Chọn thiết bị --' }}</option>
            <option v-for="e in equipment" :key="e.id" :value="e.id">[{{ e.code }}] - {{ e.name }}</option>
          </select>
        </div>

        <!-- 3. Vùng hiển thị chi tiết thiết bị -->
        <div v-if="selectedEquipment" class="p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
           <div class="flex items-start justify-between">
              <div>
                 <h4 class="text-sm font-bold text-slate-900">{{ selectedEquipment.name }}</h4>
                 <p class="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{{ selectedEquipment.code }}</p>
              </div>
              <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                 {{ selectedEquipment.type }}
              </span>
           </div>
           
           <div class="grid grid-cols-2 gap-4 text-[11px]">
              <div class="space-y-1">
                 <p class="text-slate-400 font-bold uppercase tracking-tighter">Ngày nhập kho</p>
                 <p class="text-slate-700 font-medium">{{ selectedEquipment.entry_date || 'N/A' }}</p>
              </div>
              <div class="space-y-1">
                 <p class="text-slate-400 font-bold uppercase tracking-tighter">Nhà cung cấp</p>
                 <p class="text-slate-700 font-medium truncate">{{ selectedEquipment.supplier || 'N/A' }}</p>
              </div>
           </div>

           <div v-if="parsedSpecs" class="pt-3 border-t border-blue-100 space-y-2">
              <p class="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Thông số kỹ thuật</p>
              <div class="grid grid-cols-2 gap-x-6 gap-y-1">
                 <div v-for="(val, key) in parsedSpecs" :key="key" class="flex justify-between border-b border-blue-50 py-1">
                    <span class="text-[10px] text-slate-400 font-medium capitalize">{{ key.replace('_', ' ') }}:</span>
                    <span class="text-[10px] text-slate-700 font-bold">{{ val }}</span>
                 </div>
              </div>
           </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5 pt-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ngày mang về</label>
            <input 
              v-model="form.date"
              type="datetime-local"
              required
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tình trạng hỏng hóc / Lý do sửa</label>
          <textarea 
            v-model="form.fault"
            required
            rows="4"
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 transition-all text-sm"
            placeholder="Mô tả chi tiết triệu chứng hoặc lý do cần sửa chữa..."
          ></textarea>
        </div>

        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="loading || !form.equipment_id"
            class="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Đang xử lý...' : 'Xác nhận mang về sửa' }}
          </button>
        </div>
      </form>

      <!-- Repairing History Table -->
      <div class="mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest">Thiết bị đang được sửa chữa</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th class="px-6 py-3">Thiết bị</th>
                <th class="px-6 py-3">Khoa phòng mang về</th>
                <th class="px-6 py-3 text-center">Ngày mang về</th>
                <th class="px-6 py-3 text-right">Người tiếp nhận</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 italic">
              <tr v-for="item in repairingEquipment" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div>
                    <div class="flex items-center gap-2">
                       <span class="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{{ item.code }}</span>
                       <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{{ item.type }}</span>
                    </div>
                    <p class="text-sm font-bold text-slate-900 mt-1 uppercase">{{ item.name }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-slate-600">
                  {{ item.original_department_name }}
                </td>
                <td class="px-6 py-4 text-center">
                  <p class="text-xs font-bold text-slate-700">{{ formatDate(item.repair_date) }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ formatTime(item.repair_date) }}</p>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{{ item.repairer_name }}</span>
                </td>
              </tr>
              <tr v-if="repairingEquipment.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-400 text-sm">
                  Hiện không có thiết bị nào đang sửa chữa.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';

const router = useRouter();
const equipment = ref<any[]>([]);
const departments = ref<any[]>([]);
const repairingEquipment = ref<any[]>([]);
const loading = ref(false);
const loadingEquipment = ref(false);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN');
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
};

const form = reactive({
  equipment_id: '',
  department_id: '',
  date: getLocalISOString(),
  fault: ''
});

const selectedEquipment = computed(() => {
  return equipment.value.find(e => e.id == form.equipment_id);
});

const parsedSpecs = computed(() => {
  if (!selectedEquipment.value?.specs) return null;
  try {
    const specs = typeof selectedEquipment.value.specs === 'string' 
      ? JSON.parse(selectedEquipment.value.specs) 
      : selectedEquipment.value.specs;
    return Object.keys(specs).length > 0 ? specs : null;
  } catch (e) {
    return null;
  }
});

const fetchData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  try {
    const [deptRes, repairRes] = await Promise.all([
      fetch('/api/defaults/departments', { headers }),
      fetch('/api/equipment/repairing', { headers })
    ]);
    departments.value = await deptRes.json();
    repairingEquipment.value = await repairRes.json();
  } catch (err) {
    console.error(err);
  }
};

const handleDepartmentChange = async () => {
  form.equipment_id = '';
  if (!form.department_id) {
    equipment.value = [];
    return;
  }

  loadingEquipment.value = true;
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  try {
    const res = await fetch(`/api/equipment/department/${form.department_id}`, { headers });
    equipment.value = await res.json();
  } catch (err) {
    console.error(err);
  } finally {
    loadingEquipment.value = false;
  }
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/transactions/move', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        equipment_id: form.equipment_id,
        department_id: form.department_id,
        action_type: 'Mang về sửa',
        action_date: form.date,
        fault_description: form.fault
      })
    });
    
    if (res.ok) {
      // Reset form instead of redirecting
      form.equipment_id = '';
      form.fault = '';
      form.date = getLocalISOString();
      
      // Refresh both lists
      await Promise.all([
        handleDepartmentChange(), // Refresh available equipment in selected department
        fetchData() // Refresh repairing equipment list
      ]);
      
      alert('Đã chuyển trạng thái thiết bị sang Đang sửa thành công!');
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

onMounted(fetchData);
</script>
