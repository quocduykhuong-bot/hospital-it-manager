<template>
  <Layout>
    <div class="space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Quản lý Nhân sự</h2>
          <p class="text-slate-500 text-sm">Cấp quyền và quản lý tài khoản nhân viên IT / Kỹ thuật.</p>
        </div>
        <button 
          @click="openModal(null)"
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <UserPlus size="16" /> Thêm nhân viên
        </button>
      </div>

      <!-- User Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th class="px-6 py-4">Tài khoản</th>
                <th class="px-6 py-4">Họ và tên</th>
                <th class="px-6 py-4">Vai trò</th>
                <th class="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                      {{ user.username.substring(0, 2).toUpperCase() }}
                    </div>
                    <span class="text-sm font-mono font-bold text-slate-900">{{ user.username }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ user.full_name }}</td>
                <td class="px-6 py-4">
                  <span 
                    :class="[
                      'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight',
                      user.role === 'Administrator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button @click="openModal(user)" class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit3 size="16" />
                  </button>
                  <button v-if="currentUser.role === 'Administrator'" @click="confirmDelete(user)" class="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Modal -->
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 class="font-bold text-slate-900">{{ editUser ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới' }}</h3>
             <button @click="showModal = false" class="text-slate-400 hover:text-slate-600"><X size="20" /></button>
          </div>
          <form @submit.prevent="saveUser" class="p-6 space-y-4">
             <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Tên đăng nhập</label>
                <input v-model="form.username" :disabled="!!editUser" required class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
             </div>
             <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Mật khẩu {{ editUser ? '(Bỏ trống nếu không đổi)' : '' }}</label>
                <input v-model="form.password" :required="!editUser" type="password" class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
             </div>
             <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Họ và tên</label>
                <input v-model="form.full_name" required class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
             </div>
             <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Vai trò</label>
                <select v-model="form.role" class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm cursor-pointer">
                   <option value="User">User (Nhân viên)</option>
                   <option value="Administrator">Administrator (Quản trị viên)</option>
                </select>
             </div>
             <div class="pt-4 flex gap-3">
                <button type="submit" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                  {{ editUser ? 'Cập nhật' : 'Tạo mới' }}
                </button>
                <button type="button" @click="showModal = false" class="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest">Hủy</button>
             </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Layout from '../../components/Layout.vue';
import { UserPlus, Edit3, Trash2, X } from 'lucide-vue-next';

const users = ref<any[]>([]);
const showModal = ref(false);
const editUser = ref<any>(null);
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const form = reactive({
  username: '',
  password: '',
  full_name: '',
  role: 'User'
});

const fetchData = async () => {
  const res = await fetch('/api/admin/users', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  users.value = await res.json();
};

const openModal = (user: any) => {
  editUser.value = user;
  if (user) {
    form.username = user.username;
    form.full_name = user.full_name;
    form.role = user.role;
    form.password = '';
  } else {
    form.username = '';
    form.full_name = '';
    form.role = 'User';
    form.password = '';
  }
  showModal.value = true;
};

const saveUser = async () => {
  const method = editUser.value ? 'PUT' : 'POST';
  const url = editUser.value ? `/api/admin/users/${editUser.value.id}` : '/api/admin/users';
  
  const res = await fetch(url, {
    method,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}` 
    },
    body: JSON.stringify(form)
  });
  
  if (res.ok) {
    showModal.value = false;
    fetchData();
  } else {
    const err = await res.json();
    alert('Lỗi: ' + (err.message || err.error));
  }
};

const confirmDelete = async (user: any) => {
  if (!confirm(`Xác nhận xóa tài khoản ${user.username}?`)) return;
  await fetch(`/api/admin/users/${user.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  fetchData();
};

onMounted(fetchData);
</script>
