import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Tag {
  id: string;
  nome: string;
  cor_hex: string;
}

interface TagInputProps {
  tags: Tag[]; // Alterado para array de objetos Tag
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>; // Alterado para array de objetos Tag
  availableTags?: Tag[]; // Alterado para array de objetos Tag
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags, availableTags = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<Tag[]>([]); // Alterado para array de objetos Tag
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  console.log('TagInput - availableTags recebidos:', availableTags); // Log para verificar tags disponíveis

  useEffect(() => {
    console.log('TagInput - useEffect rodando. inputValue:', inputValue, 'availableTags.length:', availableTags.length); // Log para useEffect
    if (inputValue.length > 0) {
      const filtered = availableTags.filter(tag => {
        const match = tag.nome.toLowerCase().includes(inputValue.toLowerCase()) && !tags.some(t => t.id === tag.id);
        console.log(`Tag: ${tag.nome}, Input: ${inputValue}, Match: ${match}`); // Log detalhado do filtro
        return match;
      });
      console.log('TagInput - Sugestões filtradas:', filtered); // Log para sugestões filtradas
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      console.log('TagInput - showSuggestions:', filtered.length > 0); // Log para showSuggestions
    } else {
      // Quando o inputValue está vazio, mostre todas as tags disponíveis que ainda não foram selecionadas
      const allAvailableNotSelected = availableTags.filter(tag => !tags.some(t => t.id === tag.id));
      setFilteredSuggestions(allAvailableNotSelected);
      setShowSuggestions(true); // Mostrar sugestões quando o input está vazio e focado
      console.log('TagInput - showSuggestions: true (inputValue vazio, mostrando todas as disponíveis)'); // Log para showSuggestions
    }
  }, [inputValue, availableTags, tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('TagInput - Input Change:', e.target.value); // Log para mudança no input
    setInputValue(e.target.value);
  };

  const addTag = (tag: Tag) => { // Aceita um objeto Tag
    console.log('TagInput - Adicionando tag:', tag); // Log para adicionar tag
    if (!tags.some(t => t.id === tag.id)) { // Verifica se a tag já existe pelo ID
      setTags([...tags, tag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    console.log('TagInput - Key Down:', e.key); // Log para tecla pressionada
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      // Encontrar a tag correspondente nos availableTags pelo nome digitado
      const matchedTag = availableTags.find(tag => tag.nome.toLowerCase() === inputValue.trim().toLowerCase());
      if (matchedTag) {
        addTag(matchedTag);
      } else {
        // Opcional: Tratar caso onde a tag digitada não existe nos availableTags
        console.warn(`Tag "${inputValue.trim()}" não encontrada nas tags disponíveis.`);
        // Ou adicionar como uma tag temporária sem ID/cor se a lógica permitir
      }
    } else if (e.key === 'Tab' && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      addTag(filteredSuggestions[0]);
    }
  };

  const removeTag = (tagToRemove: Tag) => { // Aceita um objeto Tag
    console.log('TagInput - Removendo tag:', tagToRemove); // Log para remover tag
    setTags(tags.filter(tag => tag.id !== tagToRemove.id)); // Remove pelo ID
  };

  return (
    <div className="space-y-2 relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="Adicione tags (pressione Enter)"
        className="bg-game-darker border-neon-green/20 text-gray-200 focus:border-neon-green focus:ring-neon-green/50"
        onFocus={() => {
          console.log('TagInput - Input Focused'); // Log para foco no input
          // Ao focar, se houver tags disponíveis e o input estiver vazio, mostre todas as tags disponíveis
          if (availableTags.length > 0 && inputValue === '') {
            const allAvailableNotSelected = availableTags.filter(tag => !tags.some(t => t.id === tag.id));
            setFilteredSuggestions(allAvailableNotSelected);
            setShowSuggestions(true);
          } else if (inputValue.length > 0) {
            // Se já houver algo digitado, reavalie as sugestões
            const filtered = availableTags.filter(tag =>
              tag.nome.toLowerCase().includes(inputValue.toLowerCase()) && !tags.some(t => t.id === tag.id)
            );
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
          }
        }}
        onBlur={() => {
          console.log('TagInput - Input Blurred'); // Log para blur no input
          setTimeout(() => setShowSuggestions(false), 100);
        }}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-game-dark border border-neon-green/20 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredSuggestions.map((tag) => (
            <div
              key={tag.id} // Usando ID como chave
              className="px-4 py-2 cursor-pointer text-gray-200 hover:bg-neon-green/20"
              onMouseDown={() => addTag(tag)} // Passa o objeto Tag completo
            >
              {tag.nome} // Exibe o nome da tag
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <Badge key={tag.id} className="bg-neon-green text-game-dark flex items-center gap-1 pr-1" style={{ backgroundColor: tag.cor_hex }}> {/* Usando ID como chave e cor_hex para o background */}
            {tag.nome} // Exibe o nome da tag
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /> {/* Passa o objeto Tag completo */}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TagInput;