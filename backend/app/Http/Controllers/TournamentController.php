<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\TournamentResource;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TournamentController extends Controller
{
    public function index(){
        return TournamentResource::collection(Tournament::all());
    }

    public function store(Request $request){
        try {
            $validated = $request->validate([
                'tournaments_name'=> 'required|string',
                'start_date'=> 'required|date',
                'end_date'=> 'required|date|after_or_equal:start_date',
            ]);

            $tournament = Tournament::create($validated);
            return (new TournamentResource($tournament))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $tournament = Tournament::findOrFail($id);
        return new TournamentResource($tournament);
    }

    public function destroy($id){
        $tournament = Tournament::findOrFail($id);
        $tournament->delete();
        return response()->json(['message' => 'tournament deleted successfully'], 200);
    }

    public function update(Request $request, $id){
        try {
            $tournament = Tournament::findOrFail($id);

            // 1. Validação dos dados para atualização
            $validated = $request->validate([
                'tournaments_name'=> 'required|string',
                'start_date'=> 'required|date',
                'end_date'=> 'required|date|after_or_equal:start_date',
            ]);

            // 2. Atualiza o registro com os dados validados
            $tournament->update($validated);

            // 3. Retorna o recurso atualizado com status 200 OK
            return (new TournamentResource($tournament))->response()->setStatusCode(200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
