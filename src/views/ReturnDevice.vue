<template>
  <Layout>
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight">Hoàn trả thiết bị sau khi sửa chữa</h2>
        <p class="text-slate-500 text-sm">Bàn giao thiết bị sau khi đã sửa xong cho khoa phòng.</p>
        <div class="mt-4 px-4 py-2 bg-slate-100 rounded-lg inline-flex items-center gap-2 text-slate-600 border border-slate-200">
          <div class="flex items-center gap-2 font-bold">
            <Clock size="14" />
            <p class="text-[11px] font-mono tracking-wider">{{ currentDateTimeDisplay }}</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn thiết bị đang sửa</label>
          <select 
            v-model="form.equipment_id" 
            @change="handleEquipmentChange"
            required 
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer"
          >
            <option value="">-- Chọn thiết bị --</option>
            <option v-for="e in equipment" :key="e.id" :value="e.id">
              [{{ e.code }}] - {{ e.name }} {{ e.is_mine ? '(Của tôi)' : '' }}
            </option>
          </select>
        </div>

        <!-- Thông tin lịch sử sửa chữa -->
        <div v-if="selectedEquipment" class="animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 space-y-3">
             <div class="flex items-center gap-2 text-indigo-600">
                <Wrench size="14" />
                <span class="text-[10px] font-bold uppercase tracking-wider">Thông tin bảo trì hiện tại</span>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                   <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Đem về từ Khoa/Phòng</p>
                   <p class="text-xs text-slate-700 font-bold">{{ selectedEquipment.original_department_name }}</p>
                </div>
                <div class="space-y-1">
                   <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Người đem về sửa</p>
                   <p class="text-xs text-slate-700 font-bold">{{ selectedEquipment.repairer_name }}</p>
                </div>
                <div class="space-y-1 md:col-span-2">
                   <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ngày đem về sửa</p>
                   <p class="text-xs text-slate-700 font-bold">{{ formatDate(selectedEquipment.repair_date) }}</p>
                </div>
             </div>

             <div class="pt-2 border-t border-indigo-100/50">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Tình trạng lỗi lúc nhận</p>
                <p class="text-xs text-slate-600 italic leading-relaxed">"{{ selectedEquipment.repair_fault || 'Không có mô tả' }}"</p>
             </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Khoa phòng nhận</label>
            <select v-model="form.department_id" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer">
              <option value="">-- Chọn khoa phòng --</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ngày trả</label>
            <input 
              v-model="form.date"
              type="datetime-local"
              required
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ghi chú kết quả sửa chữa</label>
          <textarea 
            v-model="form.note"
            rows="3"
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            placeholder="Nhập ghi chú (ví dụ: đã thay RAM, đã cài lại Win...)"
          ></textarea>
        </div>

        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
          >
            {{ loading ? 'Đang xử lý...' : 'Xác nhận trả lại khoa' }}
          </button>
        </div>
      </form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Wrench, Clock } from 'lucide-vue-next';
import Layout from '../components/Layout.vue';

const router = useRouter();
const equipment = ref<any[]>([]);
const departments = ref<any[]>([]);
const loading = ref(false);
const currentDateTimeDisplay = ref('');

const updateCurrentTime = () => {
  const now = new Date();
  currentDateTimeDisplay.value = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now).replace(',', '');
};

let timer: any = null;

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
};

const form = reactive({
  equipment_id: '',
  department_id: '',
  date: getLocalISOString(),
  note: ''
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

const selectedEquipment = computed(() => {
  return equipment.value.find(e => e.id == form.equipment_id);
});

const handleEquipmentChange = () => {
  if (selectedEquipment.value) {
    // Tự động điền khoa phòng cũ
    form.department_id = selectedEquipment.value.original_department_id;
  } else {
    form.department_id = '';
  }
};

const fetchData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  const [eqRes, deptRes] = await Promise.all([
    fetch('/api/equipment/repairing', { headers }),
    fetch('/api/defaults/departments', { headers })
  ]);
  equipment.value = await eqRes.json();
  departments.value = await deptRes.json();
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
        action_type: 'Hoàn trả sửa chữa',
        action_date: form.date,
        fault_description: 'Sửa xong: ' + form.note
      })
    });
    
    if (res.ok) {
      router.push('/dashboard');
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

onMounted(() => {
  fetchData();
  updateCurrentTime();
  timer = setInterval(updateCurrentTime, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
