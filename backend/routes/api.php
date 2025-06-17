<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GerarPartidasController;

Route::post('/gerar-partidas', [GerarPartidasController::class, 'gerar']);