const fs = require('fs');
const path = require('path');

const source1 = 'C:\\Users\\cl\\Desktop\\拉黑.png';
const dest1 = 'C:\\Users\\cl\\Desktop\\雾\\public\\拉黑.png';

const source2 = 'C:\\Users\\cl\\Desktop\\没有拉黑.png';
const dest2 = 'C:\\Users\\cl\\Desktop\\雾\\public\\没有拉黑.png';

try {
  fs.copyFileSync(source1, dest1);
  console.log('✅ 拉黑.png 复制成功');
  
  fs.copyFileSync(source2, dest2);
  console.log('✅ 没有拉黑.png 复制成功');
  
  console.log('\n所有图标复制完成！现在刷新页面就能看到了。');
} catch (err) {
  console.error('❌ 复制失败:', err.message);
}
