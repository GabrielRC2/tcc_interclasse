<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teams_group'=>$this->teams_group,
            'teams_name'=>$this->teams_name,
            'total_points'=>$this->total_points,
            'teams_gender'=>$this->teams_gender,
            // Adiciona os jogadores associados se eles foram carregados
            'players' => PlayerResource::collection($this->whenLoaded('players')),
        ];
    }
}
