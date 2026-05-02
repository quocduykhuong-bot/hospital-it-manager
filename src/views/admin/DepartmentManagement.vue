<template>
  <Layout>
    <div class="max-w-4xl mx-auto space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Quản lý Khoa / Phòng</h2>
          <p class="text-slate-500 text-sm">Danh mục vị trí làm việc trong bệnh viện để quản lý tài sản.</p>
        </div>
        <button 
          @click="showAdd = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans"
        >
          <Plus size="16" /> Thêm khoa phòng
        </button>
      </div>

      <!-- Add Form -->
      <div v-if="showAdd" ref="formSection" class="bg-white p-6 rounded-2xl border shadow-sm animate-in slide-in-from-top-4 duration-300" :class="[editingDept ? 'border-blue-400 ring-2 ring-blue-50' : 'border-blue-100']">
        <div class="flex gap-4 items-end">
           <div class="flex-1 space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên khoa / Phòng mới</label>
              <input 
                v-model="newName" 
                ref="nameInput"
                class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all" 
                :class="{'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10': isHighlighting}"
                placeholder="VD: Khoa Nội Tổng Hợp"
                @keyup.enter="saveDept"
              >
           </div>
           <div class="flex gap-2">
              <button @click="saveDept" class="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition-all">{{ editingDept ? 'Cập nhật' : 'Lưu' }}</button>
              <button @click="cancelEdit" class="px-4 py-2.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy</button>
           </div>
        </div>
      </div>

      <!-- List -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th class="px-8 py-4 w-16 text-center">#</th>
                <th class="px-8 py-4">Tên Khoa / Phòng</th>
                <th class="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(dept, index) in departments" :key="dept.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-4 text-center text-xs font-bold text-slate-300">{{ index + 1 }}</td>
                <td class="px-8 py-4 text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {{ dept.name }}
                </td>
                <td class="px-8 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="editDept(dept)" class="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                      <PenSquare size="16" />
                    </button>
                    <button v-if="user.role === 'Administrator'" @click="openConfirmDelete(dept)" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size="16" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="departments.length === 0">
                 <td colspan="3" class="px-8 py-20 text-center text-slate-400 italic">Chưa có khoa phòng nào được tạo.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- Confirmation Modal -->
    <div v-if="deptToDelete" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
           <Trash2 size="28" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
        <p class="text-slate-500 text-sm mb-8 leading-relaxed">Bạn có chắc chắn muốn xóa Khoa/Phòng <b>{{ deptToDelete.name }}</b> không? Thao tác này không thể hoàn tác.</p>
        <div class="grid grid-cols-2 gap-3">
           <button 
             @click="confirmDelete" 
             class="py-3 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
           >
             Có, Xóa
           </button>
           <button 
             @click="deptToDelete = null" 
             class="py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
           >
             Không, Hủy
           </button>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="errorMessage" class="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl shadow-red-200 animate-in slide-in-from-right-8 duration-300 z-[60] flex items-center gap-3">
       <span class="text-sm font-bold">{{ errorMessage }}</span>
       <button @click="errorMessage = ''" class="hover:bg-white/20 p-1 rounded-lg">
          <Plus class="rotate-45" size="18" />
       </button>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import Layout from '../../components/Layout.vue';
import { Plus, Trash2, PenSquare } from 'lucide-vue-next';

const departments = ref<any[]>([]);
const showAdd = ref(false);
const newName = ref('');
const editingDept = ref<any>(null);
const deptToDelete = ref<any>(null);
const errorMessage = ref('');
const isHighlighting = ref(false);

const nameInput = ref<HTMLInputElement | null>(null);
const formSection = ref<HTMLElement | null>(null);

const user = JSON.parse(localStorage.getItem('user') || '{}');

const fetchData = async () => {
  const res = await fetch('/api/admin/departments', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  departments.value = await res.json();
};

const editDept = async (dept: any) => {
  editingDept.value = dept;
  newName.value = dept.name;
  showAdd.value = true;
  
  await nextTick();
  
  if (formSection.value) {
    formSection.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  if (nameInput.value) {
    nameInput.value.focus();
    isHighlighting.value = true;
    setTimeout(() => {
      isHighlighting.value = false;
    }, 1500);
  }
};

const cancelEdit = () => {
  editingDept.value = null;
  newName.value = '';
  showAdd.value = false;
};

const saveDept = async () => {
  if (!newName.value.trim()) return;
  
  const url = editingDept.value ? `/api/admin/departments/${editingDept.value.id}` : '/api/admin/departments';
  const method = editingDept.value ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}` 
    },
    body: JSON.stringify({ name: newName.value })
  });
  
  if (res.ok) {
    newName.value = '';
    editingDept.value = null;
    showAdd.value = false;
    fetchData();
  }
};

const openConfirmDelete = (dept: any) => {
  deptToDelete.value = dept;
};

const confirmDelete = async () => {
  if (!deptToDelete.value) return;
  
  const res = await fetch(`/api/admin/departments/${deptToDelete.value.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  if (res.ok) {
    deptToDelete.value = null;
    fetchData();
  } else {
    const data = await res.json();
    errorMessage.value = data.error || 'Đã xảy ra lỗi khi xóa.';
    deptToDelete.value = null;
    // Tự đóng lỗi sau 5s
    setTimeout(() => { errorMessage.value = ''; }, 5000);
  }
};

onMounted(fetchData);
</script>
