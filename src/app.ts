import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as TWEEN from "@tweenjs/tween.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;

    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 40));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (_time) => {
            orbitControls.update();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();
        const group = new TWEEN.Group();

        // 花火を時間差で100発生成
        for (let i = 0; i < 100; i++) {
            this.createFirework(group, i * 800);
        }

        // ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        const update: FrameRequestCallback = (_time) => {
            group.update(_time);
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
    
    private createFirework = (group: TWEEN.Group, delay: number) => {
        
        const particleNum = 300;
        const maxFuseLength = 2;
        const startY = -10;
        const explodeY = Math.random() * 6 + 2;

        let finished = 0;
        let fuseActive = true;

        const burstTweens: TWEEN.Tween<any>[] = [];

        // 花火の色・位置をランダムに生成
        const color = new THREE.Color();
        color.setHSL(Math.random(), 1.0, 0.5);

        const baseColor = {
            r: color.r,
            g: color.g,
            b: color.b
        };

        const launchX = (Math.random() - 0.5) * 20; // -10〜10 の範囲
        const fuseGeometry = new THREE.BufferGeometry();

        const fuseMat = new THREE.LineBasicMaterial({
            vertexColors: true, // 頂点カラー
            transparent: true,
            opacity: 1.0
        });

        const fuseLine = new THREE.LineSegments(fuseGeometry, fuseMat);
        fuseLine.visible = false;
        this.scene.add(fuseLine);

        const fusePos = new Float32Array([
            launchX, -10, 0,   // 始点（火の玉の位置）
            launchX, -12, 0    // 終点（ひもの先）
        ]);
        const fuseColors = new Float32Array([
            1.0, 0.4, 0.0,   // 始点： オレンジ（弱い光）
            1.0, 1.0, 0.8    // 終点：黄色〜白（強い光）
        ]);

        fuseGeometry.setAttribute("position", new THREE.BufferAttribute(fusePos, 3));
        fuseGeometry.setAttribute("color", new THREE.BufferAttribute(fuseColors, 3));

        // パーティクル用の発光テクスチャを生成
        const generateCircleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;

            const ctx = canvas.getContext('2d')!;
            const center = canvas.width / 2;
            const radius = canvas.width / 2;
            const burstColors = new Float32Array(particleNum * 3);
            burstGeometry.setAttribute("color", new THREE.BufferAttribute(burstColors, 3));
            
            // 中心を明るく、外側へ向かって透明になるグラデーション
            const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
            gradient.addColorStop(0, `rgba(${baseColor.r*255},${baseColor.g*255},${baseColor.b*255},1)`);
            gradient.addColorStop(0.2, `rgba(${baseColor.r*255},${baseColor.g*255},${baseColor.b*255},1)`);
            gradient.addColorStop(1.0,`rgba(${baseColor.r*255},${baseColor.g*255},${baseColor.b*255},0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        };

        const tweeninfo = { y: startY};
        
        // 導火線を打ち上げた位置に合わせて更新
        // 上昇と同時に導火線をだんだん短くする
        const updateFirework = () => {
            if (!fuseActive) return;
            const pos = fuseLine.geometry.getAttribute("position");
            const col = fuseLine.geometry.getAttribute("color");
            const t = (tweeninfo.y + 10) / 10;

            // 打ち上げの進行率
            const progress = (tweeninfo.y - startY) / (explodeY - startY);
            
            // 進行率に応じて導火線を縮める
            const fuseLength = maxFuseLength * (1 - progress);

            pos.setY(0, tweeninfo.y);
            pos.setY(1, tweeninfo.y - fuseLength);
            pos.needsUpdate = true;

            col.setXYZ(0,1.0 * (1 - t),0.4 * (1 - t),0.0);
            col.setXYZ(1,1.0,1.0,0.8 + 0.2 * t);
            col.needsUpdate = true;
        };

        const tweenUp = new TWEEN.Tween(tweeninfo,group).to({ y: explodeY }, 4000).easing(TWEEN.Easing.Quadratic.Out).onUpdate(updateFirework);
        const burstPositions = new Float32Array(particleNum * 3);
        
        for (let i = 0; i < particleNum; i++) {
            burstPositions[i*3 + 0] = 0;
            burstPositions[i*3 + 1] = 0;
            burstPositions[i*3 + 2] = 0;
        }

        const burstGeometry = new THREE.BufferGeometry();
        const burstColors = new Float32Array(particleNum * 3);
        
        burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
        burstGeometry.setAttribute("color", new THREE.BufferAttribute(burstColors, 3));

        // マテリアルの加算合成
        const burstMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            map: generateCircleTexture(), 
            size: 0.4,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            opacity: 1.0
        })

        const burstPoints = new THREE.Points(burstGeometry, burstMaterial);
        burstPoints.visible = false;
        this.scene.add(burstPoints);

        for (let i = 0; i < particleNum; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 10;

            const tx = r * Math.sin(phi) * Math.cos(theta);
            const ty = r * Math.sin(phi) * Math.sin(theta);
            const tz = r * Math.cos(phi);
            
            const info = { x: launchX, y:explodeY, z: 0, index: i };

            // パーティクルの位置・色を毎フレーム更新
            const updateBurst = () => {
                const pos = burstPoints.geometry.getAttribute("position");
                const col = burstPoints.geometry.getAttribute("color");

                const dist = Math.sqrt(info.x * info.x + info.y * info.y + info.z * info.z);
                const t = dist / (r * 1.5);

                // 距離に応じて色をだんだん暗くする
                const fade = 1.0 - t * 0.6;

                const rCol = baseColor.r * fade;
                const gCol = baseColor.g * fade;
                const bCol = baseColor.b * fade;

                pos.setXYZ(info.index, info.x, info.y, info.z);
                pos.needsUpdate = true;

                col.setXYZ(info.index, rCol, gCol, bCol);
                col.needsUpdate = true;
            }
        
        const tween = new TWEEN.Tween(info, group)
        .to({ x: launchX + tx * 1.5, y: explodeY + ty * 1.5, z: tz * 1.5 }, 3000)
        .easing(TWEEN.Easing.Quadratic.Out).onUpdate(updateBurst)
        .onComplete(() => {
            finished++;
            if (finished === particleNum) {
            burstPoints.visible = false;
            }
        });
        burstTweens.push(tween);
        }

        setTimeout(() => {
            fuseLine.visible = true;
            tweenUp.start();
        }, delay);

        // 打ち上げ終了後に爆発開始
        tweenUp.onComplete(() => {
            fuseActive = false;
            fuseLine.visible = false;

            burstPoints.visible = true;
            burstTweens.forEach(t => t.start());
        })
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 20));
    document.body.appendChild(viewport);
}
