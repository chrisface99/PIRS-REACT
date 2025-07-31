// widget/scripts/build-pirs-fixed.js
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

  async createPIRSManifest() {
    this.log('Creating PIRS manifest.json...', 'build');
    
    // Create the required empty manifest.json for PIRS
    const manifestDest = path.join(this.buildDir, 'manifest.json');
    await fs.writeJson(manifestDest, {}, { spaces: 2 });
    
    this.log('PIRS manifest.json created (empty object)', 'success');
  }

  async cleanupReactArtifacts() {
    this.log('Cleaning up React-specific artifacts...', 'build');
    
    // Remove asset-manifest.json as it's not needed for PIRS
    const assetManifest = path.join(this.buildDir, 'asset-manifest.json');
    if (fs.existsSync(assetManifest)) {
      await fs.remove(assetManifest);
      this.log('Removed asset-manifest.json', 'success');
    }
    
    // Remove source maps in production build
    const staticDir = path.join(this.buildDir, 'static');
    if (fs.existsSync(staticDir)) {
      const removeSourceMaps = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isDirectory()) {
            await removeSourceMaps(filePath);
          } else if (file.endsWith('.map')) {
            await fs.remove(filePath);
            this.log(`Removed ${file}`, 'info');
          }
        }
      };
      
      await removeSourceMaps(staticDir);
    }
  }

  async validatePIRSBuild() {
    this.log('Validating PIRS build structure...', 'build');
    
    const requiredFiles = [
      'index.html',
      'manifest.json'
    ];

    const requiredDirs = [
      'static/js',
      'static/css'
    ];

    let isValid = true;
    
    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(this.buildDir, file);
      if (!fs.existsSync(filePath)) {
        this.log(`Missing required file: ${file}`, 'error');
        isValid = false;
      } else {
        this.log(`✓ Found ${file}`, 'success');
      }
    }

    // Check required directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.buildDir, dir);
      if (!fs.existsSync(dirPath)) {
        this.log(`Missing required directory: ${dir}`, 'error');
        isValid = false;
      } else {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          this.log(`Empty directory: ${dir}`, 'error');
          isValid = false;
        } else {
          this.log(`✓ Found ${dir} with ${files.length} files`, 'success');
        }
      }
    }

    // Validate manifest.json content
    const manifestPath = path.join(this.buildDir, 'manifest.json');
    const manifestContent = await fs.readJson(manifestPath);
    if (JSON.stringify(manifestContent) === '{}') {
      this.log('✓ manifest.json is empty object as required', 'success');
    } else {
      this.log('⚠️ manifest.json is not empty - this may cause issues', 'warning');
    }

    if (isValid) {
      this.log('PIRS build structure validation passed', 'success');
    } else {
      throw new Error('PIRS build validation failed');
    }
  }

  async generateBuildInfo() {
    const buildInfo = {
      buildTime: new Date().toISOString(),
      version: require('../package.json').version,
      pirsFiles: {
        manifest: 'manifest.json',
        html: 'index.html',
        js: this.findJSFile(),
        css: this.findCSSFile()
      },
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

  findJSFile() {
    const jsDir = path.join(this.buildDir, 'static', 'js');
    if (fs.existsSync(jsDir)) {
      const files = fs.readdirSync(jsDir);
      const jsFile = files.find(f => f.startsWith('main.') && f.endsWith('.js'));
      return jsFile ? `static/js/${jsFile}` : null;
    }
    return null;
  }

  findCSSFile() {
    const cssDir = path.join(this.buildDir, 'static', 'css');
    if (fs.existsSync(cssDir)) {
      const files = fs.readdirSync(cssDir);
      const cssFile = files.find(f => f.startsWith('main.') && f.endsWith('.css'));
      return cssFile ? `static/css/${cssFile}` : null;
    }
    return null;
  }

  async showPIRSBuildSummary(buildInfo) {
    this.log('='.repeat(60), 'deploy');
    this.log('PIRS-REACT BUILD SUMMARY', 'deploy');
    this.log('='.repeat(60), 'deploy');
    
    console.log(`📅 Build Time: ${buildInfo.buildTime}`);
    console.log(`📦 Version: ${buildInfo.version}`);
    console.log(`📁 PIRS Build: widget/build/`);
    console.log(`📁 Extension: extension/`);
    
    this.log('\n📋 PIRS Required Files:', 'info');
    console.log(`✅ manifest.json (empty object)`);
    console.log(`✅ index.html`);
    console.log(`✅ ${buildInfo.pirsFiles.js} (React bundle)`);
    console.log(`✅ ${buildInfo.pirsFiles.css} (styles)`);
    
    if (buildInfo.extension.exists) {
      this.log(`\n📋 Extension Files: ${buildInfo.extension.files.join(', ')}`, 'info');
    } else {
      this.log('\n⚠️ Extension directory not found', 'warning');
    }

    this.log('\n🚀 PIRS DEPLOYMENT READY!', 'deploy');
    this.log('Deploy these files:', 'deploy');
    this.log('├── widget/build/index.html', 'deploy');
    this.log('├── widget/build/manifest.json (empty {})', 'deploy');
    this.log(`├── widget/build/${buildInfo.pirsFiles.js}`, 'deploy');
    this.log(`└── widget/build/${buildInfo.pirsFiles.css}`, 'deploy');
  }

  async build() {
    try {
      this.log('Starting PIRS-REACT build process...', 'deploy');
      
      await this.cleanBuild();
      await this.buildReact();
      await this.createPIRSManifest();  // Create proper manifest.json
      await this.cleanupReactArtifacts(); // Remove asset-manifest.json
      await this.validatePIRSBuild();
      
      const buildInfo = await this.generateBuildInfo();
      await this.showPIRSBuildSummary(buildInfo);
      
      this.log('PIRS-REACT build process completed successfully! 🎉', 'success');
      
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the builder
const builder = new PIRSBuilder();
builder.build();