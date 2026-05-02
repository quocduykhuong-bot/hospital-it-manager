import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/repair-overview',
      name: 'Tổng quan sửa chữa',
      component: () => import('../views/RepairOverview.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/issue',
      name: 'Cấp mới TB',
      component: () => import('../views/IssueDevice.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/repair',
      name: 'Mang về sửa',
      component: () => import('../views/TakeForRepair.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/return',
      name: 'Trả lại TB',
      component: () => import('../views/ReturnDevice.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/liquidate',
      name: 'Thanh lý TB',
      component: () => import('../views/LiquidateDevice.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'Thống kê',
      component: () => import('../views/Statistics.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/users',
      name: 'Quản lý nhân sự',
      component: () => import('../views/admin/UserManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/departments',
      name: 'Quản lý khoa phòng',
      component: () => import('../views/admin/DepartmentManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/equipment/new',
      name: 'Thêm thiết bị',
      component: () => import('../views/admin/EquipmentForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/equipment/edit/:id',
      name: 'Sửa thiết bị',
      component: () => import('../views/admin/EquipmentForm.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresAdmin && user?.role !== 'Administrator') {
    next('/dashboard');
  } else if (to.path === '/login' && token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
