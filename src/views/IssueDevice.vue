<template>
  <Layout>
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight">Cấp mới thiết bị</h2>
        <p class="text-slate-500 text-sm">Ghi nhận việc cấp thiết bị mới cho khoa phòng.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn Mã thiết bị (Trong kho)</label>
            <select 
              v-model="selectedEquipmentId"
              @change="handleEquipmentChange"
              required
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-blue-600 font-bold"
            >
              <option value="">-- Chọn thiết bị --</option>
              <option v-for="e in availableEquipment" :key="e.id" :value="e.id">
                {{ e.code }} - {{ e.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tên thiết bị</label>
            <input 
              v-model="form.name"
              disabled
              class="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Loại thiết bị</label>
            <input 
              v-model="form.type"
              disabled
              class="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Khoa phòng nhận</label>
            <select v-model="form.department_id" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none cursor-pointer">
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ngày cấp</label>
          <input 
            v-model="form.date"
            type="datetime-local"
            required
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
          />
        </div>

        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
          >
            {{ loading ? 'Đang lưu...' : 'Xác nhận cấp mới' }}
          </button>
        </div>
      </form>

      <!-- QR Code Preview if success -->
      <div v-if="successData" class="mt-8 bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-green-200 mb-4" id="qr-container">
           <div class="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
              <span class="text-[10px] font-bold text-center">QR CODE:<br>{{ successData.code }}</span>
           </div>
           <div class="mt-4 text-center">
              <p class="text-xs font-bold font-mono">{{ successData.code }}</p>
              <p class="text-[10px] text-slate-500 uppercase font-medium">{{ successData.name }}</p>
           </div>
        </div>
        <button @click="printLabel" class="text-blue-600 text-xs font-bold flex items-center gap-2 hover:underline">
           <Printer size="14" /> In Label thiết bị
        </button>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Layout from '../components/Layout.vue';
import { Printer } from 'lucide-vue-next';

const departments = ref<any[]>([]);
const availableEquipment = ref<any[]>([]);
const selectedEquipmentId = ref('');
const loading = ref(false);
const successData = ref<any>(null);

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
};

const form = reactive({
  code: '',
  name: '',
  type: '',
  department_id: '',
  date: getLocalISOString()
});

const fetchData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
  const [deptRes, equipRes] = await Promise.all([
    fetch('/api/defaults/departments', { headers }),
    fetch('/api/equipment/available', { headers })
  ]);
  
  departments.value = await deptRes.json();
  availableEquipment.value = await equipRes.json();
};

const handleEquipmentChange = () => {
  const equip = availableEquipment.value.find(e => e.id == selectedEquipmentId.value);
  if (equip) {
    form.code = equip.code;
    form.name = equip.name;
    form.type = equip.type;
  } else {
    form.code = '';
    form.name = '';
    form.type = '';
  }
};

const handleSubmit = async () => {
  if (!selectedEquipmentId.value) return;
  loading.value = true;
  successData.value = null;
  try {
    // Chỉ tạo transaction movement vì master record đã tồn tại
    const res = await fetch('/api/transactions/move', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        equipment_id: selectedEquipmentId.value,
        department_id: form.department_id,
        action_type: 'Cấp mới',
        action_date: form.date,
        fault_description: 'Cấp mới từ kho'
      })
    });
    
    if (res.ok) {
      successData.value = { ...form };
      // Reset form
      selectedEquipmentId.value = '';
      form.code = '';
      form.name = '';
      form.type = '';
      // Refresh available list
      fetchData();
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

const printLabel = () => {
  window.print();
};

onMounted(fetchData);
</script>
