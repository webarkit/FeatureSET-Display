/*
 *  Simple script for running emcc on FeatureSet-Display.
 *  Original script from jsartoolkit5.
 *
 *  makem.js
 *  FeatureSet-Display
 *
 *  This file is part of FeatureSet-Display - WebARKit.
 *
 *  FeatureSet-Display is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  FeatureSet-Display is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with FeatureSet-Display.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  As a special exception, the copyright holders of this library give you
 *  permission to link this library with independent modules to produce an
 *  executable, regardless of the license terms of these independent modules, and to
 *  copy and distribute the resulting executable under terms of your choice,
 *  provided that you also meet, for each linked independent module, the terms and
 *  conditions of the license of that module. An independent module is a module
 *  which is neither derived from nor based on this library. If you modify this
 *  library, you may extend this exception to your version of the library, but you
 *  are not obligated to do so. If you do not wish to do so, delete this exception
 *  statement from your version.
 *
 *  Copyright 2021-2026 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *           : zz85 https://github.com/zz85
 *           : ThorstenBux https://github.com/ThorstenBux
 *
 */

const execFile = require('child_process').execFile;
const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

let NO_LIBAR = false;

const argv = process.argv;
for (let j = 2; j < argv.length; j++) {
	if (argv[j] === '--no-libar') {
		NO_LIBAR = true;
		console.log('Building FeatureSet-Display with --no-libar option, libar will be preserved.');
	}
}

const HAVE_NFT = 1;

// Fall back to EMSDK if EMSCRIPTEN isn't set: emsdk_env.bat sets EMSDK but
// not EMSCRIPTEN, while the original script expects EMSCRIPTEN.
let EMSCRIPTEN_ROOT = process.env.EMSCRIPTEN;
if (!EMSCRIPTEN_ROOT && process.env.EMSDK) {
	const guess = path.join(process.env.EMSDK, 'upstream', 'emscripten');
	if (fs.existsSync(path.join(guess, 'emcc.py'))) {
		EMSCRIPTEN_ROOT = guess;
	}
}
const WEBARKITLIB_ROOT = process.env.WEBARKITLIB_ROOT || path.resolve(__dirname, '../emscripten/WebARKitLib');

if (!EMSCRIPTEN_ROOT) {
	console.log('\nWarning: EMSCRIPTEN environment variable not found.');
	console.log('If you get a "command not found" error,\ndo `source <path to emsdk>/emsdk_env.sh` and try again.');
}

// Resolve how to invoke emcc. On Unix this is simple. On Windows, the
// installed entry point is emcc.bat, but Node 18.20+/20.12+/22.x refuse to
// spawn .bat files via execFile (CVE-2024-27980 mitigation, returns EINVAL).
// shell:true would re-introduce cmd.exe's ~8k command-line limit. Instead,
// locate the underlying emcc.py and call python directly, which avoids
// both the .bat block and the cmd.exe limit.
function resolveEmccPrefix() {
	if (!isWindows) {
		const emcc = EMSCRIPTEN_ROOT ? path.resolve(EMSCRIPTEN_ROOT, 'emcc') : 'emcc';
		return { cmd: emcc, prefixArgs: [] };
	}
	let batDir;
	if (EMSCRIPTEN_ROOT) {
		batDir = EMSCRIPTEN_ROOT;
	} else {
		try {
			const out = execSync('where emcc.bat', { encoding: 'utf8' });
			batDir = path.dirname(out.split(/\r?\n/)[0].trim());
		} catch (e) {
			console.error('Could not locate emcc.bat. Set EMSCRIPTEN env var or add emsdk to PATH.');
			process.exit(1);
		}
	}
	const pyScript = path.join(batDir, 'emcc.py');
	if (!fs.existsSync(pyScript)) {
		console.error('Cannot find emcc.py next to emcc.bat at ' + batDir);
		process.exit(1);
	}
	const python = process.env.EMSDK_PYTHON || 'python';
	return { cmd: python, prefixArgs: [pyScript] };
}

const EMCC_INVOKE = resolveEmccPrefix();
function emccCmd(args) {
	return [EMCC_INVOKE.cmd].concat(EMCC_INVOKE.prefixArgs).concat(args);
}

const OPTIMIZE_FLAGS = '-Oz'; // -Oz for smallest size
const MEM = 256 * 1024 * 1024; // 256MB

const SOURCE_PATH = path.resolve(__dirname, '../emscripten');
const OUTPUT_PATH = path.resolve(__dirname, '../build');

const BUILD_WASM_FILE = 'arfset_wasm.js';
const BUILD_WASM_ES6_FILE = 'arfset_ES6_wasm.js';

if (!fs.existsSync(path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h'))) {
	console.log('Renaming and moving config.h.in to config.h');
	fs.copyFileSync(
		path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h.in'),
		path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h')
	);
	console.log('Done!');
}

const MAIN_SOURCES = ['ARimageFsetDisplay.cpp'].map(function (src) {
	return path.resolve(SOURCE_PATH, src);
});

// Expand "dir/*.ext" patterns in Node, since cmd.exe on Windows doesn't
// expand globs the way bash/zsh do.
function expandGlob(pattern) {
	if (pattern.indexOf('*') === -1) return [pattern];
	const dir = path.dirname(pattern);
	const ext = path.extname(pattern);
	return fs.readdirSync(dir)
		.filter(function (f) { return path.extname(f) === ext; })
		.map(function (f) { return path.join(dir, f); });
}

let ar_sources = [
	'AR/arLabelingSub/*.c',
	'AR/*.c',
	'ARICP/*.c',
	'ARUtil/log.c',
	'ARUtil/file_utils.c',
].map(function (src) {
	return path.resolve(WEBARKITLIB_ROOT, 'lib/SRC', src);
}).reduce(function (acc, src) {
	return acc.concat(expandGlob(src));
}, []);

const ar2_sources = [
	'handle.c',
	'imageSet.c',
	'jpeg.c',
	'marker.c',
	'featureMap.c',
	'featureSet.c',
	'selectTemplate.c',
	'surface.c',
	'tracking.c',
	'tracking2d.c',
	'matching.c',
	'matching2.c',
	'template.c',
	'searchPoint.c',
	'coord.c',
	'util.c',
].map(function (src) {
	return path.resolve(WEBARKITLIB_ROOT, 'lib/SRC/AR2', src);
});

const kpm_sources = [
	'KPM/kpmHandle.cpp',
	'KPM/kpmRefDataSet.cpp',
	'KPM/kpmMatching.cpp',
	'KPM/kpmResult.cpp',
	'KPM/kpmUtil.cpp',
	'KPM/kpmFopen.c',
	'KPM/FreakMatcher/detectors/DoG_scale_invariant_detector.cpp',
	'KPM/FreakMatcher/detectors/gaussian_scale_space_pyramid.cpp',
	'KPM/FreakMatcher/detectors/gradients.cpp',
	//'KPM/FreakMatcher/detectors/harris.cpp',
	'KPM/FreakMatcher/detectors/orientation_assignment.cpp',
	'KPM/FreakMatcher/detectors/pyramid.cpp',
	'KPM/FreakMatcher/facade/visual_database_facade.cpp',
	'KPM/FreakMatcher/matchers/hough_similarity_voting.cpp',
	'KPM/FreakMatcher/matchers/freak.cpp',
	'KPM/FreakMatcher/framework/date_time.cpp',
	'KPM/FreakMatcher/framework/image.cpp',
	'KPM/FreakMatcher/framework/logger.cpp',
	'KPM/FreakMatcher/framework/timers.cpp',
].map(function (src) {
	return path.resolve(WEBARKITLIB_ROOT, 'lib/SRC', src);
});

if (HAVE_NFT) {
	ar_sources = ar_sources.concat(ar2_sources).concat(kpm_sources);
}

let DEFINES = [];
if (HAVE_NFT) DEFINES.push('-D', 'HAVE_NFT');

const FLAGS = [
	OPTIMIZE_FLAGS,
	'-Wno-warn-absolute-paths',
	// TOTAL_MEMORY was renamed to INITIAL_MEMORY in emscripten 1.39.x.
	'-s', 'INITIAL_MEMORY=' + MEM,
	'-s', 'USE_ZLIB=1',
	'-s', 'USE_LIBJPEG',
	'-s', 'EXPORTED_RUNTIME_METHODS=["FS"]',
	'-s', 'ALLOW_MEMORY_GROWTH=1',
	'--bind',
];

const WASM_FLAGS = ['-s', 'SINGLE_FILE=1'];
const ES6_FLAGS = [
	'-s', 'EXPORT_ES6=1',
	'-s', 'ENVIRONMENT=web',
	'-s', 'EXPORT_NAME=arFset',
	'-s', 'MODULARIZE=1',
];

const INCLUDES = [
	path.resolve(WEBARKITLIB_ROOT, 'include'),
	OUTPUT_PATH,
	SOURCE_PATH,
	path.resolve(WEBARKITLIB_ROOT, 'lib/SRC/KPM/FreakMatcher'),
].map(function (s) { return '-I' + s; });

function clean_builds() {
	try {
		fs.statSync(OUTPUT_PATH);
	} catch (e) {
		fs.mkdirSync(OUTPUT_PATH);
	}
	try {
		const files = fs.readdirSync(OUTPUT_PATH);
		let filesLength = files.length;
		if (filesLength > 0 && NO_LIBAR === true) filesLength -= 1;
		for (let i = 0; i < filesLength; i++) {
			const filePath = path.join(OUTPUT_PATH, files[i]);
			if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
		}
	} catch (e) {
		return console.log(e);
	}
}

const LIBAR_BC = path.resolve(OUTPUT_PATH, 'libar.o');

const compile_arlib = emccCmd(
	INCLUDES
		.concat(ar_sources)
		.concat(FLAGS)
		.concat(DEFINES)
		.concat(['-r', '-o', LIBAR_BC])
);

const compile_wasm = emccCmd(
	INCLUDES
		.concat([LIBAR_BC])
		.concat(MAIN_SOURCES)
		.concat(FLAGS)
		.concat(DEFINES)
		.concat(['-o', path.resolve(OUTPUT_PATH, BUILD_WASM_FILE)])
);

const compile_wasm_es6 = emccCmd(
	INCLUDES
		.concat([LIBAR_BC])
		.concat(MAIN_SOURCES)
		.concat(FLAGS)
		.concat(WASM_FLAGS)
		.concat(DEFINES)
		.concat(ES6_FLAGS)
		.concat(['-o', path.resolve(OUTPUT_PATH, BUILD_WASM_ES6_FILE)])
);

/*
 * Run commands
 */

function onExec(error, stdout, stderr) {
	if (stdout) console.log('stdout: ' + stdout);
	if (stderr) console.log('stderr: ' + stderr);
	if (error !== null) {
		console.log('exec error: ' + error.code);
		process.exit(typeof error.code === 'number' ? error.code : 1);
	} else {
		runJob();
	}
}

const jobs = [];

function addJob(job) { jobs.push(job); }

function runJob() {
	if (!jobs.length) {
		console.log('Jobs completed');
		return;
	}
	const cmd = jobs.shift();
	if (typeof cmd === 'function') {
		cmd();
		runJob();
		return;
	}
	if (Array.isArray(cmd)) {
		console.log('\nRunning command (execFile): ' + cmd.join(' ') + '\n');
		execFile(cmd[0], cmd.slice(1), { maxBuffer: 64 * 1024 * 1024 }, onExec);
	} else if (typeof cmd === 'string') {
		console.log('\nRunning command (exec): ' + cmd + '\n');
		exec(cmd, onExec);
	} else {
		console.error('Invalid command type:', cmd);
		process.exit(1);
	}
}

addJob(clean_builds);
addJob(compile_arlib);
addJob(compile_wasm);
addJob(compile_wasm_es6);

if (NO_LIBAR === true) {
	jobs.splice(1, 1);
}

runJob();
