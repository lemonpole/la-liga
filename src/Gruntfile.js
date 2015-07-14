module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      develop: {
        src: './renderer/main.js',
        dest: './static/bundle.js',
        options: {
          transform: ['reactify']
        }
      }
    },
    less: {
      develop: {
        options: {
          paths: ['./less'],
          compress: true
        },
        files: {
          './static/bundle.css': './less/main.less'
        }
      }
    },
    postcss: {
      develop: {
        options: {
          map: true,
          processors: [
            require('autoprefixer-core')({browsers: 'last 2 versions'})
          ]
        },
        dist: {
          src: './static/bundle.css'
        }
      }
    },
    shell: {
      prunePrev: {
        command: [
          'rm -rf ../dist/resources/app',
          'mkdir ../dist/resources/app'
        ].join('&&')
      },
      copySrc: {
        command: [
          'cp ./package.json ../dist/resources/app',
          'cp ./main.js ../dist/resources/app',
          'cp -r ./static ../dist/resources/app',
        ].join('&&')
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('build', [
    'browserify:develop','less:develop','postcss:develop','shell:prunePrev','shell:copySrc'
  ]);
}