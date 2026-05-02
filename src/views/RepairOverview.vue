<template>
  <Layout>
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Tổng quan sửa chữa</h2>
          <p class="text-slate-500">Theo dõi các thiết bị đang trong quá trình bảo trì.</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Của tôi đang giữ</p>
          <p class="text-2xl font-bold">{{ myRepairCount }}</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Tổng cộng đang sửa</p>
          <p class="text-2xl font-bold">{{ repairingList.length }}</p>
        </div>
      </div>

      <!-- List -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Wrench size="16" class="text-blue-600" />
            Danh sách thiết bị đang sửa
          </h3>
          <p v-if="loading" class="text-xs text-slate-400 animate-pulse">Đang tải...</p>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th class="px-6 py-3 border-b border-slate-100">Mã TB</th>
                <th class="px-6 py-3 border-b border-slate-100">Tên thiết bị</th>
                <th class="px-6 py-3 border-b border-slate-100">Khoa phòng</th>
                <th class="px-6 py-3 border-b border-slate-100">Ngày mang về</th>
                <th class="px-6 py-3 border-b border-slate-100">Người giữ</th>
                <th class="px-6 py-3 border-b border-slate-100 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="item in sortedRepairingList" 
                :key="item.id"
                :class="[
                  'transition-colors text-sm',
                  item.is_mine ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50/50'
                ]"
              >
                <td class="px-6 py-4 text-xs font-mono font-bold" :class="item.is_mine ? 'text-blue-700' : 'text-slate-500'">
                  {{ item.code }}
                </td>
                <td class="px-6 py-4" :class="{'font-bold text-slate-900 underline decoration-blue-200 underline-offset-4': item.is_mine}">
                  {{ item.name }}
                </td>
                <td class="px-6 py-4">
                   <div class="text-xs font-bold text-slate-700">{{ item.original_department_name || 'Đang cập nhật' }}</div>
                </td>
                <td class="px-6 py-4 text-[11px] text-slate-500 font-medium">
                   {{ formatDateTime(item.repair_date) }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-bold text-slate-700">{{ item.repairer_name }}</span>
                    <span 
                      v-if="item.is_mine" 
                      class="w-fit px-1 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded uppercase tracking-tighter"
                    >CỦA TÔI</span>
                    <span v-else class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">NHÂN VIÊN KHÁC</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">Đang sửa</span>
                </td>
              </tr>
              <tr v-if="!loading && sortedRepairingList.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">
                  Không có thiết bị nào đang sửa chữa.
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
import { ref, onMounted, computed } from 'vue';
import Layout from '../components/Layout.vue';
import { Wrench } from 'lucide-vue-next';

const repairingList = ref<any[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/equipment/repairing', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    repairingList.value = await res.json();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const sortedRepairingList = computed(() => {
  // Ưu tiên thiết bị is_mine lên đầu
  return [...repairingList.value].sort((a, b) => {
    if (a.is_mine === b.is_mine) return 0;
    return a.is_mine ? -1 : 1;
  });
});

const myRepairCount = computed(() => {
  return repairingList.value.filter(i => i.is_mine).length;
});

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'Chưa rõ';
  const d = new Date(dateString);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${date} ${time}`;
};

onMounted(fetchData);
</script>
