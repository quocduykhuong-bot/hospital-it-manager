<template>
  <div class="min-h-screen bg-slate-50 flex font-sans text-slate-900">
    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="p-6 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">H</div>
          <h1 class="text-lg font-bold text-white leading-tight">
            Hospital IT 
            <span class="block text-[10px] uppercase font-normal opacity-50 tracking-widest mt-0.5">Quản Lý thiết bị</span>
          </h1>
        </div>
      </div>
      
      <nav class="flex-1 py-6 px-4 space-y-1">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium group"
          :class="[$route.path === item.path ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']"
        >
          <component :is="item.icon" size="18" :class="[$route.path === item.path ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300']" />
          <span>{{ item.label }}</span>
          <ChevronRight v-if="$route.path === item.path" size="14" class="ml-auto opacity-40" />
        </router-link>
      </nav>
      
      <div class="p-6 bg-slate-950/50 border-t border-slate-800">
        <!-- Real-time Clock -->
        <div class="mb-5 flex items-center gap-2.5 px-3 py-2 bg-slate-900/40 rounded-xl border border-slate-800/50 group">
          <div class="p-1.5 bg-slate-800 rounded-lg text-blue-400 group-hover:text-blue-300 transition-colors">
            <Clock size="14" />
          </div>
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">Thời gian hiện tại</span>
            <span class="text-[11px] font-bold font-mono text-slate-300 tracking-wider transition-colors group-hover:text-white">
              {{ currentDateTime }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 bg-slate-700 text-slate-200 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
            {{ user?.username?.substring(0, 2).toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="text-xs font-bold text-white truncate">{{ user?.full_name }}</p>
            <p class="text-[10px] uppercase tracking-wider text-blue-400 font-bold">{{ user?.role }}</p>
          </div>
        </div>
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-xs font-medium group"
        >
          <LogOut size="16" class="group-hover:translate-x-0.5 transition-transform" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = true" class="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Menu size="24" />
          </button>
          <h2 class="text-lg font-bold text-slate-900 capitalize tracking-tight">
            {{ currentRouteName }}
          </h2>
        </div>
        
        <div class="flex items-center gap-4">
           <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              <Users size="14" class="text-blue-500" />
              <span>Hệ thống trực tuyến</span>
           </div>
        </div>
      </header>

      <div class="flex-1 p-8 overflow-y-auto">
        <slot></slot>
      </div>
    </main>

    <!-- Mobile Overlay -->
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  ShieldCheck,
  Activity,
  Package, 
  ArrowRightLeft, 
  Trash2, 
  LogOut, 
  ChevronRight, 
  Menu, 
  Users,
  PlusCircle,
  Wrench,
  Undo2,
  BarChart3,
  Building2,
  Clock
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const isSidebarOpen = ref(false);

const user = JSON.parse(localStorage.getItem('user') || '{}');

const menuItems = computed(() => {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: ShieldCheck },
    { label: 'Tổng quan sửa chữa', path: '/repair-overview', icon: Activity },
    { label: 'Thống kê', path: '/statistics', icon: BarChart3 },
    { label: 'Cấp mới TB', path: '/issue', icon: PlusCircle },
    { label: 'Thiết bị sửa chữa', path: '/repair', icon: Wrench },
    { label: 'Trả lại TB', path: '/return', icon: Undo2 },
    { label: 'Thanh lý TB', path: '/liquidate', icon: Trash2 },
  ];
  
  if (user.role === 'Administrator') {
    items.push(
      { label: 'Quản lý Nhân sự', path: '/admin/users', icon: Users }
    );
  }

  // Cả Admin và User đều quản lý Khoa/Phòng theo yêu cầu mới
  items.push(
    { label: 'Khoa / Phòng', path: '/admin/departments', icon: Building2 }
  );
  
  return items;
});

const currentRouteName = computed(() => {
  return String(route.name || 'Hệ thống');
});

const currentDateTime = ref('');
let timer: any = null;

const updateDateTime = () => {
  const now = new Date();
  currentDateTime.value = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now).replace(',', '');
};

onMounted(() => {
  updateDateTime();
  timer = setInterval(updateDateTime, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>
