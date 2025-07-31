const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class PIRSBuilder {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.buildDir = path.join(this.rootDir, 'build');
    this.extensionDir = path.join(this.rootDir, '..', 'extension');
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      build: '🏗️',
      deploy: '🚀'
    };
    console.log(`${icons[type] || 'ℹ️'} ${message}`);
  }

  async cleanBuild() {
    this.log('Cleaning previous build...', 'build');
    if (fs.existsSync(this.buildDir)) {
      await fs.remove(this.buildDir);
      this.log('Previous build cleaned', 'success');
    }
  }

  async buildReact() {
    this.log('Starting React build...', 'build');
    try {
      execSync('react-scripts build', { 
        stdio: 'inherit',
        cwd: this.rootDir 
      });
      this.log('React build completed successfully!', 'success');
    } catch (error) {
      this.log('React build failed!', 'error');
      throw error;
    }
  }

  async copyManifest() {
    const manifestSrc = path.join(this.rootDir, 'manifest.json');
    const manifestDest = path.join(this.buildDir, 'manifest.json');

    if (fs.existsSync(manifestSrc)) {
      await fs.copy(manifestSrc, manifestDest);
      this.log('Widget manifest.json copied', 'success');
    } else {
      this.log('Widget manifest.json not found - creating empty one', 'warning');
      await fs.writeJson(manifestDest, {});
    }
  }

  async validateBuild() {
    this.log('Validating build structure...', 'build');
    
    const requiredFiles = [
      'index.html',
      'manifest.json',
      'static/js',
      'static/css'
    ];

    let isValid = true;
    for (const file of requiredFiles) {
      const filePath = path.join(this.buildDir, file);
      if (!fs.existsSync(filePath)) {
        this.log(`Missing required file/directory: ${file}`, 'error');
        isValid = false;
      }
    }

    if (isValid) {
      this.log('Build structure validation passed', 'success');
    } else {
      throw new Error('Build validation failed');
    }
  }

  async generateBuildInfo() {
    const buildInfo = {
      buildTime: new Date().toISOString(),
      version: require('../package.json').version,
      files: this.getFileTree(this.buildDir),
      extension: {
        exists: fs.existsSync(this.extensionDir),
        files: fs.existsSync(this.extensionDir) ? fs.readdirSync(this.extensionDir) : []
      }
    };

    await fs.writeJson(
      path.join(this.buildDir, 'build-info.json'),
      buildInfo,
      { spaces: 2 }
    );

    this.log('Build info generated', 'success');
    return buildInfo;
  }

  getFileTree(dir, prefix = '') {
    const items = [];
    if (!fs.existsSync(dir)) return items;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        items.push({
          name: `${prefix}${file}/`,
          type: 'directory',
          children: this.getFileTree(filePath, `${prefix}${file}/`)
        });
      } else {
        items.push({
          name: `${prefix}${file}`,
          type: 'file',
          size: stat.size
        });
      }
    }
    return items;
  }

  async showBuildSummary(buildInfo) {
    this.log('='.repeat(50), 'deploy');
    this.log('PIRS BUILD SUMMARY', 'deploy');
    this.log('='.repeat(50), 'deploy');
    
    console.log(`📅 Build Time: ${buildInfo.buildTime}`);
    console.log(`📦 Version: ${buildInfo.version}`);
    console.log(`📁 Widget Build: widget/build/`);
    console.log(`📁 Extension: extension/`);
    
    this.log('\n📋 Widget Build Contents:', 'info');
    this.printFileTree(buildInfo.files);
    
    if (buildInfo.extension.exists) {
      this.log(`\n📋 Extension Files: ${buildInfo.extension.files.join(', ')}`, 'info');
    } else {
      this.log('\n⚠️ Extension directory not found', 'warning');
    }

    this.log('\n🚀 Ready for deployment!', 'deploy');
    this.log('Widget files: widget/build/', 'deploy');
    this.log('Extension files: extension/', 'deploy');
  }

  printFileTree(items, depth = 0) {
    const indent = '  '.repeat(depth);
    for (const item of items) {
      if (item.type === 'directory') {
        console.log(`${indent}📁 ${item.name}`);
        if (item.children) {
          this.printFileTree(item.children, depth + 1);
        }
      } else {
        const size = item.size > 1024 ? `${Math.round(item.size/1024)}KB` : `${item.size}B`;
        console.log(`${indent}📄 ${item.name} (${size})`);
      }
    }
  }

  async build() {
    try {
      this.log('Starting PIRS build process...', 'deploy');
      
      await this.cleanBuild();
      await this.buildReact();
      await this.copyManifest();
      await this.validateBuild();
      
      const buildInfo = await this.generateBuildInfo();
      await this.showBuildSummary(buildInfo);
      
      this.log('Build process completed successfully! 🎉', 'success');
      
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the builder
const builder = new PIRSBuilder();
builder.build();