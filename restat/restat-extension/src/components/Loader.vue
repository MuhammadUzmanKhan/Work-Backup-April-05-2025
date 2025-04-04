<template>
  <div role="status">
    <LoadingOutlined class="text-gray-200 animate-spin dark:text-gray-600" style="font-size: 32px; color: white;" />
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script>
import { LoadingOutlined } from '@ant-design/icons-vue';
export default {
  name: 'LoaderComponent',
  components: {
    LoadingOutlined,
  },
};
</script>
