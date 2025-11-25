import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, input, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { LayerState } from '../../models/uaca.model';
import * as THREE from 'three';

@Component({
  selector: 'app-aod-threejs-viewer',
  template: `<div #container class="w-full h-full border border-cyan-500/20 rounded-md"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AodThreejsViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef;
  
  layer = input.required<LayerState>();
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private stateSphere!: THREE.Mesh;
  private pathLine!: THREE.Line;
  private frameId: number | null = null;
  private readonly spaceSize = 100;

  constructor() {
    effect(() => {
      if (this.scene) { // Ensure three.js has been initialized
        this.updateVisualization();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
  
  private initThree(): void {
    const container = this.containerRef.nativeElement;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(100, 100, 150);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    
    // State Space Cube
    const boxGeometry = new THREE.BoxGeometry(this.spaceSize, this.spaceSize, this.spaceSize);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.5 }));
    line.position.set(this.spaceSize/2, this.spaceSize/2, this.spaceSize/2);
    this.scene.add(line);

    // Axes Helpers (I, C, H)
    const axesHelper = new THREE.AxesHelper(this.spaceSize * 0.75);
    this.scene.add(axesHelper);

    // State Sphere
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    this.stateSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.stateSphere);

    // Path Line
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([]);
    this.pathLine = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.pathLine);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Initial update
    this.updateVisualization();

    // Handle resize
    new ResizeObserver(() => this.onResize()).observe(container);
  }

  private updateVisualization(): void {
    const currentLayer = this.layer();
    if (!currentLayer) return;

    // Update Sphere Position
    const { I, C, H } = currentLayer.aodState;
    this.stateSphere.position.set(I, H, C); // Map H to Y, C to Z

    // Update Path Line
    const points = currentLayer.log
        .map(log => new THREE.Vector3(log.aodState.I, log.aodState.H, log.aodState.C))
        .reverse(); // from oldest to newest
    
    this.pathLine.geometry.setFromPoints(points);
    this.pathLine.geometry.attributes.position.needsUpdate = true;
  }
  
  private animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);
    
    // Optional: add some rotation for better viewing
    this.scene.rotation.y += 0.002;
    
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const container = this.containerRef.nativeElement;
    if (container) {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }
}