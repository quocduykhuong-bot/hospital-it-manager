<template>
  <Layout>
    <div class="space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Quản trị hệ thống</h2>
          <p class="text-slate-500 text-sm">Chào mừng bạn! Chọn một khu vực để bắt đầu quản lý.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Card User -->
        <router-link v-if="user.role === 'Administrator'" to="/admin/users" class="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all hover:-translate-y-1">
           <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size="24" />
           </div>
           <h3 class="text-lg font-bold text-slate-900 mb-2">Quản lý Nhân sự</h3>
           <p class="text-sm text-slate-500 mb-6">Thêm mới, phân quyền và quản lý tài khoản kỹ thuật viên IT.</p>
           <span class="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
              Truy cập <ArrowRight size="14" />
           </span>
        </router-link>

        <!-- Card Departments -->
        <router-link to="/admin/departments" class="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all hover:-translate-y-1">
           <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 size="24" />
           </div>
           <h3 class="text-lg font-bold text-slate-900 mb-2">Khoa / Phòng</h3>
           <p class="text-sm text-slate-500 mb-6">Thiết lập danh mục các đơn vị vận hành thiết bị trong bệnh viện.</p>
           <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
              Truy cập <ArrowRight size="14" />
           </span>
        </router-link>

        <!-- Card Equipment -->
        <router-link to="/admin/equipment/new" class="group bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all hover:-translate-y-1">
           <div class="w-12 h-12 bg-slate-800 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PlusCircle size="24" />
           </div>
           <h3 class="text-lg font-bold text-white mb-2">Thiết bị mới</h3>
           <p class="text-sm text-slate-400 mb-6">Đăng ký thiết bị mới vào kho và cấu hình thông số kỹ thuật.</p>
           <span class="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
              Bắt đầu <ArrowRight size="14" />
           </span>
        </router-link>

        <!-- Seed Data (Admin only tool) -->
        <div v-if="user.role === 'Administrator'" @click="showSeedModal = true" class="group bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all hover:-translate-y-1 cursor-pointer">
           <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Database v-if="!seeding" size="24" />
              <div v-else class="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full"></div>
           </div>
           <h3 class="text-lg font-bold text-slate-900 mb-2">Nạp dữ liệu nhanh</h3>
           <p class="text-sm text-slate-500 mb-6">Tự động chèn thiết bị vào kho để kiểm thử chức năng cấp phát.</p>
           <span class="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
              Phát sinh ngay <Database size="14" />
           </span>
        </div>
      </div>

      <!-- Seed Modal -->
      <div v-if="showSeedModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
          <button @click="showSeedModal = false" class="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size="20" class="text-slate-400" />
          </button>
          
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Database size="28" />
          </div>
          
          <h3 class="text-2xl font-bold text-slate-900 mb-2">Nạp dữ liệu mẫu</h3>
          <p class="text-slate-500 text-sm mb-8">Hệ thống sẽ tự động sinh mã thiết bị duy nhất và các cấu hình tương ứng.</p>
          
          <div class="space-y-5">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại thiết bị</label>
              <select v-model="seedForm.type" class="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer">
                <option v-for="type in equipmentTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số lượng cần tạo</label>
              <input type="number" v-model="seedForm.quantity" min="1" max="100" class="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" />
            </div>

            <template v-if="isComputer">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPU</label>
                  <input v-model="seedForm.cpu" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-xs" placeholder="VD: Core i7-12700" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mainboard</label>
                  <input v-model="seedForm.mainboard" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-xs" placeholder="VD: ASUS B660" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RAM</label>
                  <input v-model="seedForm.ram" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-xs" placeholder="VD: 16GB DDR4" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ổ cứng (HDD/SSD)</label>
                  <input v-model="seedForm.storage" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-xs" placeholder="VD: SSD 512GB" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Công ty cung cấp</label>
                <input v-model="seedForm.supplier" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-xs" placeholder="VD: Phong Vũ Computer" />
              </div>
            </template>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú bổ sung (Không bắt buộc)</label>
              <textarea v-model="seedForm.note" rows="2" class="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 resize-none" placeholder="VD: Lô hàng bảo hành..."></textarea>
            </div>
          </div>
          
          <div class="mt-8 grid grid-cols-2 gap-4">
            <button 
              @click="confirmSeed" 
              :disabled="seeding"
              class="py-4 bg-blue-600 text-white font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div v-if="seeding" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              {{ seeding ? 'Đang tạo...' : 'Xác nhận tạo' }}
            </button>
            <button 
              @click="showSeedModal = false" 
              class="py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Summary / Logs simulation -->
      <div class="pt-8 border-t border-slate-200">
         <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Hoạt động gần đây</h3>
         <div class="space-y-4">
            <div v-for="n in 3" :key="n" class="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl items-center shadow-sm">
               <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
               <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700">Hệ thống ghi nhận hoạt động quản trị #{{ n }}</p>
                  <p class="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Vừa xong</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import Layout from '../../components/Layout.vue';
import { Users, Building2, PlusCircle, ArrowRight, Database, X } from 'lucide-vue-next';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const seeding = ref(false);
const showSeedModal = ref(false);
const seedForm = reactive({
  type: 'Desktop',
  quantity: 10,
  note: '',
  cpu: '',
  mainboard: '',
  ram: '',
  storage: '',
  supplier: ''
});

const isComputer = computed(() => ['Desktop', 'Laptop'].includes(seedForm.type));

const equipmentTypes = [
  'Desktop', 'Laptop', 'Máy in', 'Màn hình', 'Máy scan', 'Máy quét vân tay', 'Máy quét barcode', 'Khác'
];

const confirmSeed = async () => {
  if (seeding.value) return;
  
  seeding.value = true;
  try {
    const res = await fetch('/api/equipment/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(seedForm)
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      showSeedModal.value = false;
      // Reset form
      seedForm.quantity = 10;
      seedForm.note = '';
      seedForm.cpu = '';
      seedForm.mainboard = '';
      seedForm.ram = '';
      seedForm.storage = '';
      seedForm.supplier = '';
    } else {
      alert('Lỗi: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Không thể kết nối đến máy chủ.');
  } finally {
    seeding.value = false;
  }
};
</script>
